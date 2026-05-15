import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  message: z.string().trim().min(1),
});

const agentActionSchema = z.object({
  action: z.enum(["create", "update", "delete", "list", "clarify"]),
  reply: z.string(),
  studentName: z.string().nullable(),
  date: z.string().nullable(),
  startTime: z.string().nullable(),
  durationMinutes: z.number().int().positive().nullable(),
  targetDate: z.string().nullable(),
  targetStartTime: z.string().nullable(),
  targetDurationMinutes: z.number().int().positive().nullable(),
});

type AgentAction = z.infer<typeof agentActionSchema>;

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function getDateRange(dateInput: string) {
  const start = parseDateInput(dateInput);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  return { start, end };
}

function getStudentFullName(student: { firstName: string; lastName: string }) {
  return `${student.firstName} ${student.lastName}`.trim();
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes + minutesToAdd, 0, 0);

  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function getMinutesBetweenTimes(startTime: string, endTime: string) {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
}

async function findStudentByName(studentName: string | null) {
  if (!studentName) {
    return null;
  }

  const students = await prisma.student.findMany({
    orderBy: { createdAt: "desc" },
  });
  const normalizedName = studentName.toLowerCase();

  return (
    students.find(
      (student) => getStudentFullName(student).toLowerCase() === normalizedName,
    ) ??
    students.find((student) =>
      getStudentFullName(student).toLowerCase().includes(normalizedName),
    ) ??
    students.find((student) =>
      normalizedName.includes(getStudentFullName(student).toLowerCase()),
    ) ??
    null
  );
}

async function hasTimeConflict(
  classDate: string,
  startTime: string,
  endTime: string,
  ignoredSessionId?: number,
) {
  const { start, end } = getDateRange(classDate);

  const conflict = await prisma.classSession.findFirst({
    where: {
      id: ignoredSessionId ? { not: ignoredSessionId } : undefined,
      classDate: {
        gte: start,
        lt: end,
      },
      startTime: {
        lt: endTime,
      },
      endTime: {
        gt: startTime,
      },
    },
  });

  return conflict !== null;
}

async function findLesson(action: AgentAction) {
  const student = await findStudentByName(action.studentName);
  const date = action.date;
  const startTime = action.startTime;

  if (!date && !student && !startTime) {
    return null;
  }

  const range = date ? getDateRange(date) : null;

  const sessions = await prisma.classSession.findMany({
    where: {
      classDate: range
        ? {
            gte: range.start,
            lt: range.end,
          }
        : undefined,
      startTime: startTime || undefined,
      studentId: student?.id,
    },
    include: { student: true },
    orderBy: [{ classDate: "asc" }, { startTime: "asc" }],
  });

  return sessions[0] ?? null;
}

async function executeList(action: AgentAction) {
  const date = action.date ?? formatDateInput(new Date());
  const { start, end } = getDateRange(date);
  const sessions = await prisma.classSession.findMany({
    where: {
      classDate: {
        gte: start,
        lt: end,
      },
    },
    include: { student: true },
    orderBy: { startTime: "asc" },
  });

  if (sessions.length === 0) {
    return { reply: `No lessons found on ${date}.`, sessions };
  }

  return {
    reply: sessions
      .map(
        (session) =>
          `${session.startTime}-${session.endTime}: ${getStudentFullName(
            session.student,
          )} (${session.title})`,
      )
      .join("\n"),
    sessions,
  };
}

async function executeCreate(action: AgentAction) {
  const student = await findStudentByName(action.studentName);
  const date = action.date;
  const startTime = action.startTime;
  const duration = action.durationMinutes ?? 60;

  if (!student || !date || !startTime) {
    return {
      reply:
        "I need a student, date, and start time. Example: Add 45min lesson for Jane Lee tomorrow at 10:15.",
      sessions: [],
    };
  }

  const endTime = addMinutesToTime(startTime, duration);

  if (await hasTimeConflict(date, startTime, endTime)) {
    return {
      reply:
        "I cannot add that lesson because the time range overlaps another lesson.",
      sessions: [],
    };
  }

  const session = await prisma.classSession.create({
    data: {
      studentId: student.id,
      title: `${duration}min`,
      classDate: parseDateInput(date),
      startTime,
      endTime,
      notes: null,
    },
    include: { student: true },
  });

  return {
    reply: `Added ${duration}min lesson for ${getStudentFullName(
      student,
    )} on ${date} at ${startTime}.`,
    sessions: [session],
  };
}

async function executeDelete(action: AgentAction) {
  const session = await findLesson(action);

  if (!session) {
    return {
      reply:
        "I could not find the lesson to delete. Try including student, date, and start time.",
      sessions: [],
    };
  }

  await prisma.classSession.delete({
    where: { id: session.id },
  });

  return {
    reply: `Deleted ${getStudentFullName(session.student)} lesson on ${formatDateInput(
      session.classDate,
    )} at ${session.startTime}.`,
    sessions: [],
  };
}

async function executeUpdate(action: AgentAction) {
  const session = await findLesson(action);

  if (!session) {
    return {
      reply:
        "I could not find the lesson to update. Try including the current student, date, and start time.",
      sessions: [],
    };
  }

  const currentDuration = getMinutesBetweenTimes(
    session.startTime,
    session.endTime,
  );
  const nextDate = action.targetDate ?? action.date ?? formatDateInput(session.classDate);
  const nextStartTime = action.targetStartTime ?? session.startTime;
  const nextDuration = action.targetDurationMinutes ?? currentDuration;
  const nextEndTime = addMinutesToTime(nextStartTime, nextDuration);

  if (await hasTimeConflict(nextDate, nextStartTime, nextEndTime, session.id)) {
    return {
      reply:
        "I cannot update that lesson because the new time overlaps another lesson.",
      sessions: [],
    };
  }

  const updatedSession = await prisma.classSession.update({
    where: { id: session.id },
    data: {
      classDate: parseDateInput(nextDate),
      startTime: nextStartTime,
      endTime: nextEndTime,
      title: `${nextDuration}min`,
    },
    include: { student: true },
  });

  return {
    reply: `Updated ${getStudentFullName(
      updatedSession.student,
    )} lesson to ${nextDate} ${nextStartTime}-${nextEndTime}.`,
    sessions: [updatedSession],
  };
}

function getOutputText(response: unknown) {
  const data = response as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  };

  if (data.output_text) {
    return data.output_text;
  }

  return (
    data.output
      ?.flatMap((item) => item.content ?? [])
      .find((content) => content.type === "output_text")?.text ?? ""
  );
}

async function interpretWithLlm(message: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const [students, sessions] = await Promise.all([
    prisma.student.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.classSession.findMany({
      include: { student: true },
      orderBy: [{ classDate: "asc" }, { startTime: "asc" }],
    }),
  ]);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      instructions:
        "You are a calendar control agent. Convert the user request into one JSON action only. Use dates as YYYY-MM-DD and times as 24-hour HH:mm. For relative dates, use the provided current date. For update/delete, date/startTime/studentName describe the existing lesson; targetDate/targetStartTime/targetDurationMinutes describe the requested new values. If critical information is missing, use action clarify.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                currentDate: formatDateInput(new Date()),
                userMessage: message,
                students: students.map((student) => ({
                  id: student.id,
                  name: getStudentFullName(student),
                })),
                lessons: sessions.map((session) => ({
                  id: session.id,
                  student: getStudentFullName(session.student),
                  date: formatDateInput(session.classDate),
                  startTime: session.startTime,
                  endTime: session.endTime,
                  title: session.title,
                })),
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "calendar_action",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              action: {
                type: "string",
                enum: ["create", "update", "delete", "list", "clarify"],
              },
              reply: { type: "string" },
              studentName: { type: ["string", "null"] },
              date: { type: ["string", "null"] },
              startTime: { type: ["string", "null"] },
              durationMinutes: { type: ["integer", "null"] },
              targetDate: { type: ["string", "null"] },
              targetStartTime: { type: ["string", "null"] },
              targetDurationMinutes: { type: ["integer", "null"] },
            },
            required: [
              "action",
              "reply",
              "studentName",
              "date",
              "startTime",
              "durationMinutes",
              "targetDate",
              "targetStartTime",
              "targetDurationMinutes",
            ],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  const data = await response.json();
  const outputText = getOutputText(data);
  const parsedAction = agentActionSchema.safeParse(JSON.parse(outputText));

  if (!parsedAction.success) {
    throw new Error("The LLM returned an invalid calendar action.");
  }

  return parsedAction.data;
}

async function executeAction(action: AgentAction) {
  if (action.action === "clarify") {
    return { reply: action.reply, sessions: [] };
  }

  if (action.action === "list") {
    return executeList(action);
  }

  if (action.action === "create") {
    return executeCreate(action);
  }

  if (action.action === "delete") {
    return executeDelete(action);
  }

  return executeUpdate(action);
}

export async function POST(req: Request) {
  if (process.env.CALENDAR_AGENT_ENABLED !== "true") {
    return NextResponse.json(
      {
        reply:
          "The calendar AI agent is currently disabled. Set CALENDAR_AGENT_ENABLED=true to enable it.",
        sessions: [],
      },
      { status: 403 },
    );
  }

  const body = await req.json();
  const result = requestSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { reply: "Please enter a calendar request." },
      { status: 400 },
    );
  }

  try {
    const action = await interpretWithLlm(result.data.message);
    return NextResponse.json(await executeAction(action));
  } catch (error) {
    return NextResponse.json(
      {
        reply:
          error instanceof Error && error.message.includes("OPENAI_API_KEY")
            ? "The LLM agent is not configured. Add OPENAI_API_KEY to .env, then restart the dev server."
            : "The LLM agent could not process that request.",
        sessions: [],
      },
      { status: 500 },
    );
  }
}
