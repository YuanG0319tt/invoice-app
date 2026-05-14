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

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
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

  const session = await prisma.classSession.update({
    where: { id: Number(params.id) },
    data: {
      studentId: result.data.studentId,
      title: result.data.title,
      classDate: new Date(result.data.classDate),
      startTime: result.data.startTime,
      endTime: result.data.endTime,
      notes: result.data.notes || null,
    },
    include: {
      student: true,
    },
  });

  return NextResponse.json(session);
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;

  await prisma.classSession.delete({
    where: { id: Number(params.id) },
  });

  return NextResponse.json({
    message: "Lesson deleted",
  });
}
