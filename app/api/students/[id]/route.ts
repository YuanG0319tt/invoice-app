import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const studentSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^\d{1,10}$/, "Phone must be 1 to 10 digits"),
});

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const body = await req.json();

  const result = studentSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 400 }
    );
  }

  const student = await prisma.student.update({
    where: { id: Number(params.id) },
    data: {
      firstName: result.data.firstName,
      lastName: result.data.lastName,
      email: result.data.email,
      phone: result.data.phone,
    },
  });

  return NextResponse.json(student);
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const studentId = Number(params.id);

  await prisma.$transaction([
    prisma.classSession.deleteMany({
      where: { studentId },
    }),
    prisma.student.delete({
      where: { id: studentId },
    }),
  ]);

  return NextResponse.json({
    message: "Student deleted",
  });
}
