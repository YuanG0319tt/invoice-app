export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

export function getStudentFullName(student: Student) {
  return `${student.firstName} ${student.lastName}`.trim();
}

interface StudentTableProps {
  deletingStudentId: number | null;
  isLoading: boolean;
  searchQuery: string;
  students: Student[];
  onDeleteStudent: (studentId: number) => Promise<void>;
  onEditStudent: (student: Student) => void;
}

export default function StudentTable({
  deletingStudentId,
  isLoading,
  searchQuery,
  students,
  onDeleteStudent,
  onEditStudent,
}: StudentTableProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#d8dbd2] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#e2e5dc] p-5">
        <div>
          <h2 className="text-lg font-semibold">Student list</h2>
          <p className="mt-1 text-sm text-[#65705c]">
            Contact information for active students.
          </p>
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead className="bg-[#f8f9f5] text-xs font-semibold uppercase tracking-wide text-[#68705f]">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#e5e7df]">
            {students.map((student) => {
              const isDeleting = deletingStudentId === student.id;

              return (
                <tr key={student.id} className="hover:bg-[#fafbf7]">
                  <td className="px-5 py-4 font-semibold">
                    {getStudentFullName(student)}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#65705c]">
                    {student.email || "-"}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#65705c]">
                    {student.phone || "-"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEditStudent(student)}
                        className="h-9 rounded-md border border-[#cfd3c7] px-3 text-sm font-semibold text-[#394832] hover:bg-[#f2f4ee]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => onDeleteStudent(student.id)}
                        className="h-9 rounded-md border border-[#e0b7b7] px-3 text-sm font-semibold text-[#8b2f2f] hover:bg-[#fff7f7] disabled:cursor-not-allowed disabled:border-[#d8dbd2] disabled:text-[#9aa292]"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 md:hidden">
        {students.map((student) => {
          const isDeleting = deletingStudentId === student.id;

          return (
            <article
              key={student.id}
              className="rounded-md border border-[#dde2d5] bg-[#fafbf7] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {getStudentFullName(student)}
                  </h3>
                  <p className="mt-2 text-sm text-[#65705c]">
                    {student.email || "-"}
                  </p>
                  <p className="mt-1 text-sm text-[#65705c]">
                    {student.phone || "-"}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => onEditStudent(student)}
                    className="h-9 rounded-md border border-[#cfd3c7] px-3 text-sm font-semibold text-[#394832] hover:bg-[#f2f4ee]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => onDeleteStudent(student.id)}
                    className="h-9 rounded-md border border-[#e0b7b7] px-3 text-sm font-semibold text-[#8b2f2f] hover:bg-[#fff7f7] disabled:cursor-not-allowed disabled:border-[#d8dbd2] disabled:text-[#9aa292]"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {!isLoading && students.length === 0 ? (
        <p className="m-5 rounded-md border border-dashed border-[#cfd3c7] p-5 text-sm text-[#65705c]">
          {searchQuery
            ? "No students match your search."
            : "No students yet. Add the first student to start building the directory."}
        </p>
      ) : null}

      {isLoading ? (
        <p className="m-5 rounded-md border border-dashed border-[#cfd3c7] p-5 text-sm text-[#65705c]">
          Loading students...
        </p>
      ) : null}
    </section>
  );
}
