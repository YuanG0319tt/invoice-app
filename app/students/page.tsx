"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import StudentForm from "@/components/StudentForm";
import StudentModal from "@/components/StudentModal";
import StudentSearch from "@/components/StudentSearch";
import StudentTable, {
  getStudentFullName,
  type Student,
} from "@/components/StudentTable";

type StudentsResponse = Student[] | { data: Student[] };

function getStudentsFromResponse(response: StudentsResponse) {
  return Array.isArray(response) ? response : response.data;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<number | null>(
    null,
  );
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [error, setError] = useState("");

  const fetchStudents = useCallback(async () => {
    try {
      const response = await fetch("/api/students");

      if (!response.ok) {
        throw new Error("Could not load students.");
      }

      const data = (await response.json()) as StudentsResponse;

      setStudents(getStudentsFromResponse(data));
      setError("");
    } catch {
      setError("Could not load students. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function createStudent(student: Omit<Student, "id">) {
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(student),
      });

      if (!response.ok) {
        throw new Error("Could not add student.");
      }

      await fetchStudents();
      return true;
    } catch {
      setError("Could not add student. Please try again.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteStudent(studentId: number) {
    setError("");
    setDeletingStudentId(studentId);

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not delete student.");
      }

      setStudents((currentStudents) =>
        currentStudents.filter((student) => student.id !== studentId),
      );
    } catch {
      setError("Could not delete student. Please try again.");
    } finally {
      setDeletingStudentId(null);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadStudents() {
      try {
        const response = await fetch("/api/students");

        if (!response.ok) {
          throw new Error("Could not load students.");
        }

        const data = (await response.json()) as StudentsResponse;

        if (isMounted) {
          setStudents(getStudentsFromResponse(data));
          setError("");
        }
      } catch {
        if (isMounted) {
          setError("Could not load students. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadStudents();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredStudents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return students;
    }

    return students.filter((student) =>
      [getStudentFullName(student), student.email, student.phone].some((value) =>
        (value ?? "").toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [students, searchQuery]);

  return (
    <main className="min-h-screen bg-[#f6f7f2] px-4 py-6 text-[#1f241c] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-lg border border-[#d8dbd2] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                href="/"
                className="mb-4 inline-flex h-9 items-center rounded-md border border-[#cfd3c7] px-3 text-sm font-semibold text-[#394832] hover:bg-[#f2f4ee]"
              >
                Home
              </Link>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#68705f]">
                Students
              </p>
              <h1 className="mt-2 text-3xl font-semibold">
                Student directory
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65705c]">
                Keep student contact details organized for scheduling and
                invoices.
              </p>
            </div>

            <div className="rounded-lg border border-[#dfe3d8] bg-[#fafbf7] px-5 py-4">
              <p className="text-sm font-medium text-[#65705c]">
                Total students
              </p>
              <p className="mt-1 text-3xl font-semibold">{students.length}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <StudentForm
            error={error}
            isSaving={isSaving}
            onCreateStudent={createStudent}
          />

          <section className="space-y-4">
            <StudentSearch
              resultCount={filteredStudents.length}
              searchQuery={searchQuery}
              totalCount={students.length}
              onSearchChange={setSearchQuery}
            />

            <StudentTable
              deletingStudentId={deletingStudentId}
              isLoading={isLoading}
              searchQuery={searchQuery}
              students={filteredStudents}
              onDeleteStudent={deleteStudent}
              onEditStudent={setEditingStudent}
            />
          </section>
        </section>
      </div>

      <StudentModal
        open={editingStudent !== null}
        student={editingStudent}
        onClose={() => setEditingStudent(null)}
        onSaved={fetchStudents}
      />
    </main>
  );
}
