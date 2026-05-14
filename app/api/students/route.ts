import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const studentSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^\d{1,10}$/, "Phone must be 1 to 10 digits"),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page") || "1");
  const sizeParam = searchParams.get("size");
  const size = sizeParam ? Number(sizeParam) : undefined;

  const where = search
    ? {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      }
    : undefined;

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip: size ? (page - 1) * size : undefined,
      take: size,
      orderBy: { createdAt: "desc" },
    }),
    prisma.student.count({ where }),
  ]);

  return NextResponse.json({
    data: students,
    total,
    page,
    size: size ?? total,
    totalPages: size ? Math.ceil(total / size) : 1,
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const result = studentSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.flatten() },
      { status: 400 }
    );
  }

  const student = await prisma.student.create({
    data: {
      firstName: result.data.firstName,
      lastName: result.data.lastName,
      email: result.data.email,
      phone: result.data.phone,
    },
  });

  return NextResponse.json(student, { status: 201 });
}
