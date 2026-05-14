"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Student = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
};

type ClassSession = {
  id: number;
  studentId: number;
  title: string;
  classDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  createdAt: string;
  student: Student;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const visibleSessionsPerDay = 9;

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

function getMonthDays(displayDate: Date) {
  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return date;
  });
}

function getSessionDateKey(session: ClassSession) {
  return session.classDate.slice(0, 10);
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parseDateInput(value));
}

function formatMonthTitle(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getStudentFullName(student: Student) {
  return `${student.firstName} ${student.lastName}`.trim();
}

export default function CalendarPage() {
  const todayKey = formatDateInput(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [displayDate, setDisplayDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [studentId, setStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [isStudentMenuOpen, setIsStudentMenuOpen] = useState(false);
  const [title, setTitle] = useState("Lesson");
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("17:00");
  const [notes, setNotes] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStudents();
    fetchSessions();
  }, []);

  async function fetchStudents() {
    const res = await fetch("/api/students");
    const data = await res.json();
    const students = Array.isArray(data) ? data : data.data;

    setStudents(students);
    setStudentId((currentStudentId) => {
      if (currentStudentId) {
        return currentStudentId;
      }

      const firstStudent = students[0];
      setStudentSearch(firstStudent ? getStudentFullName(firstStudent) : "");

      return String(firstStudent?.id ?? "");
    });
  }

  async function fetchSessions() {
    const res = await fetch("/api/sessions");
    const data = await res.json();

    setSessions(data);
  }

  const sessionsByDate = useMemo(() => {
    return sessions.reduce<Record<string, ClassSession[]>>((groupedSessions, session) => {
      const dateKey = getSessionDateKey(session);

      groupedSessions[dateKey] = [...(groupedSessions[dateKey] ?? []), session];

      return groupedSessions;
    }, {});
  }, [sessions]);

  const monthDays = useMemo(() => getMonthDays(displayDate), [displayDate]);
  const selectedSessions = sessionsByDate[selectedDate] ?? [];
  const filteredStudents = useMemo(() => {
    const normalizedSearch = studentSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return students;
    }

    return students.filter((student) =>
      getStudentFullName(student).toLowerCase().includes(normalizedSearch),
    );
  }, [students, studentSearch]);

  function moveMonth(direction: number) {
    setDisplayDate((currentDate) => {
      const nextDate = new Date(currentDate);
      nextDate.setMonth(currentDate.getMonth() + direction);

      return nextDate;
    });
  }

  function selectDate(date: Date) {
    setSelectedDate(formatDateInput(date));
  }

  function resetForm() {
    setEditingSessionId(null);
    setTitle("Lesson");
    setNotes("");
    setStartTime("16:00");
    setEndTime("17:00");
    const selectedStudent =
      students.find((student) => String(student.id) === studentId) ??
      students[0];

    setStudentId(String(selectedStudent?.id ?? ""));
    setStudentSearch(selectedStudent ? getStudentFullName(selectedStudent) : "");
  }

  function editSession(session: ClassSession) {
    setError("");
    setEditingSessionId(session.id);
    setSelectedDate(getSessionDateKey(session));
    setStudentId(String(session.studentId));
    setStudentSearch(getStudentFullName(session.student));
    setTitle(session.title);
    setStartTime(session.startTime);
    setEndTime(session.endTime);
    setNotes(session.notes ?? "");
  }

  function selectStudent(student: Student) {
    setStudentId(String(student.id));
    setStudentSearch(getStudentFullName(student));
    setIsStudentMenuOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!studentId || !selectedDate || !title.trim() || !startTime || !endTime) {
      setError("Choose a student, date, title, start time, and end time.");
      return;
    }

    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }

    setIsSaving(true);

    const res = await fetch(
      editingSessionId ? `/api/sessions/${editingSessionId}` : "/api/sessions",
      {
        method: editingSessionId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          title: title.trim(),
          classDate: selectedDate,
          startTime,
          endTime,
          notes: notes.trim() || null,
        }),
      },
    );

    setIsSaving(false);

    if (!res.ok) {
      setError(
        editingSessionId
          ? "Could not update the lesson. Please try again."
          : "Could not save the lesson. Please try again.",
      );
      return;
    }

    resetForm();
    await fetchSessions();
  }

  async function deleteSession(sessionId: number) {
    setError("");
    setDeletingSessionId(sessionId);

    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    setDeletingSessionId(null);

    if (!res.ok) {
      setError("Could not delete the lesson. Please try again.");
      return;
    }

    if (editingSessionId === sessionId) {
      resetForm();
    }

    setSessions((currentSessions) =>
      currentSessions.filter((session) => session.id !== sessionId),
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f6f0] px-4 py-6 text-[#1f241c] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[100rem] gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="overflow-hidden rounded-lg border border-[#d7dbce] bg-white shadow-sm">
          <header className="flex flex-col gap-4 border-b border-[#e2e5dc] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/"
                className="mb-3 inline-flex h-9 items-center rounded-md border border-[#cfd4c5] px-3 text-sm font-semibold text-[#394832] hover:bg-[#f2f4ee]"
              >
                Home
              </Link>
              <h1 className="text-2xl font-semibold">Lesson calendar</h1>
              <p className="mt-1 text-sm text-[#65705c]">
                {formatMonthTitle(displayDate)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                className="h-10 rounded-md border border-[#cfd4c5] px-3 text-sm font-medium hover:bg-[#f2f4ee]"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setDisplayDate(today);
                  setSelectedDate(formatDateInput(today));
                }}
                className="h-10 rounded-md border border-[#cfd4c5] px-3 text-sm font-medium hover:bg-[#f2f4ee]"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => moveMonth(1)}
                className="h-10 rounded-md border border-[#cfd4c5] px-3 text-sm font-medium hover:bg-[#f2f4ee]"
              >
                Next
              </button>
            </div>
          </header>

          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-7 border-b border-[#e2e5dc] bg-[#f8f9f5]">
                {weekdays.map((weekday) => (
                  <div
                    key={weekday}
                    className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#68705f]"
                  >
                    {weekday}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {monthDays.map((date) => {
                  const dateKey = formatDateInput(date);
                  const daySessions = sessionsByDate[dateKey] ?? [];
                  const isCurrentMonth = date.getMonth() === displayDate.getMonth();
                  const isSelected = dateKey === selectedDate;
                  const isToday = dateKey === todayKey;

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => selectDate(date)}
                      className={[
                        "min-h-[15.5rem] border-b border-r border-[#e5e7df] p-2 text-left transition hover:bg-[#f2f6ee]",
                        isCurrentMonth ? "bg-white" : "bg-[#fafaf7] text-[#9aa292]",
                        isSelected ? "ring-2 ring-inset ring-[#556b46]" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={[
                            "grid h-7 w-7 place-items-center rounded-full text-sm font-semibold",
                            isToday ? "bg-[#1f241c] text-white" : "",
                          ].join(" ")}
                        >
                          {date.getDate()}
                        </span>
                        {daySessions.length > 0 ? (
                          <span className="text-xs font-semibold text-[#556b46]">
                            {daySessions.length}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 space-y-1">
                        {daySessions.slice(0, visibleSessionsPerDay).map((session) => (
                          <div
                            key={session.id}
                            className="truncate rounded bg-[#e7efe0] px-2 py-0.5 text-[11px] font-medium leading-5 text-[#304326]"
                          >
                            {session.startTime} {getStudentFullName(session.student)}
                          </div>
                        ))}
                        {daySessions.length > visibleSessionsPerDay ? (
                          <div className="text-xs font-medium text-[#68705f]">
                            +{daySessions.length - visibleSessionsPerDay} more
                          </div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-[#d7dbce] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#68705f]">
              Selected date
            </p>
            <h2 className="mt-2 text-xl font-semibold">{formatLongDate(selectedDate)}</h2>

            <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
              {editingSessionId ? (
                <div className="rounded-md border border-[#d9dfd0] bg-[#f8faf4] px-3 py-2 text-sm font-medium text-[#3f4c39]">
                  Editing lesson #{editingSessionId}
                </div>
              ) : null}

              <label className="grid gap-1.5 text-sm font-medium">
                Date
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10 rounded-md border border-[#cfd3c7] px-3 font-normal outline-none focus:border-[#53624b]"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium">
                Student
                <div className="relative">
                  <input
                    type="search"
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setStudentId("");
                      setIsStudentMenuOpen(true);
                    }}
                    onFocus={() => setIsStudentMenuOpen(true)}
                    onBlur={() => setIsStudentMenuOpen(false)}
                    placeholder="Search student"
                    className="h-10 w-full rounded-md border border-[#cfd3c7] bg-white px-3 font-normal outline-none focus:border-[#53624b]"
                  />
                  {isStudentMenuOpen ? (
                    <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-[#cfd3c7] bg-white py-1 shadow-lg">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectStudent(student)}
                            className="block w-full px-3 py-2 text-left text-sm font-normal hover:bg-[#f2f4ee]"
                          >
                            {getStudentFullName(student)}
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-sm font-normal text-[#65705c]">
                          No students found.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              </label>

              <label className="grid gap-1.5 text-sm font-medium">
                Lesson title
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 rounded-md border border-[#cfd3c7] px-3 font-normal outline-none focus:border-[#53624b]"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-sm font-medium">
                  Start
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-10 rounded-md border border-[#cfd3c7] px-3 font-normal outline-none focus:border-[#53624b]"
                  />
                </label>

                <label className="grid gap-1.5 text-sm font-medium">
                  End
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-10 rounded-md border border-[#cfd3c7] px-3 font-normal outline-none focus:border-[#53624b]"
                  />
                </label>
              </div>

              <label className="grid gap-1.5 text-sm font-medium">
                Notes
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="rounded-md border border-[#cfd3c7] px-3 py-2 font-normal outline-none focus:border-[#53624b]"
                />
              </label>

              {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={isSaving || students.length === 0}
                  className="h-10 rounded-md bg-[#1f241c] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#9aa292]"
                >
                  {isSaving
                    ? editingSessionId
                      ? "Updating..."
                      : "Adding..."
                    : editingSessionId
                      ? "Update lesson"
                      : "Add lesson"}
                </button>
                {editingSessionId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="h-10 rounded-md border border-[#cfd3c7] px-4 text-sm font-semibold text-[#394832] hover:bg-[#f2f4ee]"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded-lg border border-[#d7dbce] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Lessons</h2>
              <span className="text-sm font-medium text-[#68705f]">
                {selectedSessions.length}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {selectedSessions.length > 0 ? (
                selectedSessions.map((session) => (
                  <article
                    key={session.id}
                    className="rounded-md border border-[#dde2d5] bg-[#fafbf7] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{session.title}</h3>
                        <p className="mt-1 text-sm text-[#65705c]">
                          {getStudentFullName(session.student)}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#e7efe0] px-2 py-1 text-xs font-semibold text-[#304326]">
                        {session.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium">
                      {session.startTime} - {session.endTime}
                    </p>
                    {session.notes ? (
                      <p className="mt-2 text-sm text-[#65705c]">{session.notes}</p>
                    ) : null}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => editSession(session)}
                        className="h-8 rounded-md border border-[#cfd3c7] px-3 text-xs font-semibold text-[#394832] hover:bg-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSession(session.id)}
                        disabled={deletingSessionId === session.id}
                        className="h-8 rounded-md border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                      >
                        {deletingSessionId === session.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-[#cfd3c7] p-4 text-sm text-[#65705c]">
                  No lessons scheduled for this date.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
