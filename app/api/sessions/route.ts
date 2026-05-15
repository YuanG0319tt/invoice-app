import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const sessionSchema = z.object({
  studentId: z.coerce.number().int().positive("Student is required"),
  title: z.string().trim().min(1, "Lesson title is required"),
  classDate: z.string().trim().min(1, "Lesson date is required"),
  startTime: z.string().trim().min(1, "Start time is required"),
  endTime: z.string().trim().min(1, "End time is required"),
  notes: z.string().trim().nullable().optional(),
});

function getDateRange(dateInput: string) {
  const start = new Date(dateInput);
  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  return { start, end };
}

async function hasTimeConflict(
  classDate: string,
  startTime: string,
  endTime: string,
) {
  const { start, end } = getDateRange(classDate);

  const conflict = await prisma.classSession.findFirst({
    where: {
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

export async function GET() {
  const sessions = await prisma.classSession.findMany({
    include: {
      student: true,
    },
    orderBy: {
      classDate: "asc",
    },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const body = await req.json();
  const result = sessionSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 400 },
    );
  }

  if (result.data.startTime >= result.data.endTime) {
    return NextResponse.json(
      { error: "End time must be after start time." },
      { status: 400 },
    );
  }

  const hasConflict = await hasTimeConflict(
    result.data.classDate,
    result.data.startTime,
    result.data.endTime,
  );

  if (hasConflict) {
    return NextResponse.json(
      { error: "Another lesson already uses this time range." },
      { status: 409 },
    );
  }

  const session = await prisma.classSession.create({
    data: {
      studentId: result.data.studentId,

      title: result.data.title,

      classDate: new Date(result.data.classDate),

      startTime: result.data.startTime,
      endTime: result.data.endTime,

      notes: result.data.notes || null,
    },
  });

  return NextResponse.json(session);
}
