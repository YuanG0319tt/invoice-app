"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { type Student } from "./StudentTable";

const studentSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

interface Props {
  open: boolean;
  student: Student | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function StudentModal({
  open,
  student,
  onClose,
  onSaved,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    reset({
      firstName: student?.firstName || "",
      lastName: student?.lastName || "",
      email: student?.email || "",
      phone: student?.phone || "",
    });
  }, [student, reset]);

  if (!open || !student) return null;

  const activeStudent = student;

  async function onSubmit(data: StudentFormData) {
    const response = await fetch(`/api/students/${activeStudent.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      toast.error("Failed to save student");
      return;
    }

    toast.success("Student updated");
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold">Edit student</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              className="w-full rounded-md border border-[#cfd3c7] p-2 outline-none focus:border-[#53624b]"
              placeholder="First name"
              {...register("firstName")}
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <input
              className="w-full rounded-md border border-[#cfd3c7] p-2 outline-none focus:border-[#53624b]"
              placeholder="Last name"
              {...register("lastName")}
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm">
                {errors.lastName.message}
              </p>
            )}
          </div>

          <div>
            <input
              className="w-full rounded-md border border-[#cfd3c7] p-2 outline-none focus:border-[#53624b]"
              placeholder="Email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          <div>
            <input
              className="w-full rounded-md border border-[#cfd3c7] p-2 outline-none focus:border-[#53624b]"
              placeholder="Phone"
              {...register("phone")}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#cfd3c7] px-4 py-2 text-sm font-semibold text-[#394832] hover:bg-[#f2f4ee]"
            >
              Cancel
            </button>

            <button
              disabled={isSubmitting}
              className="rounded-md bg-[#1f241c] px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-[#9aa292]"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
