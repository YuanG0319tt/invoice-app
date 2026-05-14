import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

  const session = await prisma.classSession.create({
    data: {
      studentId: Number(body.studentId),

      title: body.title,

      classDate: new Date(body.classDate),

      startTime: body.startTime,
      endTime: body.endTime,

      notes: body.notes,
    },
  });

  return NextResponse.json(session);
}