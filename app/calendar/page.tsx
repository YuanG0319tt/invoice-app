"use client";

import Link from "next/link";
import type { DragEvent, MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type CalendarView = "year" | "month" | "week" | "day";

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

type ResizeState = {
  sessionId: number;
  columnTop: number;
  previewEndTime: string;
};

type DropPreview = {
  dateKey: string;
  startTime: string;
  endTime: string;
  hasConflict: boolean;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const calendarViews: CalendarView[] = ["year", "month", "week", "day"];
const lessonOptions = [
  { label: "30min", minutes: 30 },
  { label: "45min", minutes: 45 },
  { label: "60min", minutes: 60 },
];
const scheduleHours = Array.from({ length: 15 }, (_, index) => index + 7);
const scheduleStartHour = scheduleHours[0];
const scheduleEndHour = scheduleHours[scheduleHours.length - 1] + 1;
const hourSlotHeight = 96;
const timeSnapMinutes = 5;
const minLessonMinutes = 15;

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

function getStudentFullName(student: Student) {
  return `${student.firstName} ${student.lastName}`.trim();
}

function getLessonMinutes(title: string) {
  const customMinutes = Number(title.replace("min", ""));

  if (title.endsWith("min") && Number.isFinite(customMinutes)) {
    return customMinutes;
  }

  return (
    lessonOptions.find((option) => option.label === title)?.minutes ??
    lessonOptions[0].minutes
  );
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes + minutesToAdd, 0, 0);

  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function formatMinutesAsTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}`;
}

function getMinutesBetweenTimes(startTime: string, endTime: string) {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
}

function getMinutesFromTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function snapMinutes(minutes: number) {
  return Math.round(minutes / timeSnapMinutes) * timeSnapMinutes;
}

function clampMinutes(minutes: number) {
  return Math.min(
    scheduleEndHour * 60,
    Math.max(scheduleStartHour * 60, minutes),
  );
}

function getLessonOptionLabel(session: ClassSession) {
  const savedOption = lessonOptions.find(
    (option) => option.label === session.title,
  );

  if (savedOption) {
    return savedOption.label;
  }

  if (/^\d+min$/.test(session.title)) {
    return session.title;
  }

  const durationOption = lessonOptions.find(
    (option) =>
      option.minutes ===
      getMinutesBetweenTimes(session.startTime, session.endTime),
  );

  return (
    durationOption?.label ??
    `${getMinutesBetweenTimes(session.startTime, session.endTime)}min`
  );
}

function getSessionDateKey(session: ClassSession) {
  return session.classDate.slice(0, 10);
}

function getWeekDays(date: Date) {
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - date.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + index);

    return day;
  });
}

function getMonthDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + index);

    return day;
  });
}

function getSessionTop(session: ClassSession) {
  const scheduleStartMinutes = scheduleStartHour * 60;
  const sessionStartMinutes = getMinutesFromTime(session.startTime);

  return ((sessionStartMinutes - scheduleStartMinutes) / 60) * hourSlotHeight;
}

function getSessionHeightFromTimes(startTime: string, endTime: string) {
  return (getMinutesBetweenTimes(startTime, endTime) / 60) * hourSlotHeight;
}

function isCompactSession(startTime: string, endTime: string) {
  return getMinutesBetweenTimes(startTime, endTime) <= 30;
}

function formatHour(hour: number) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2026, 0, 1, hour, 0));
}

function formatViewTitle(date: Date, view: CalendarView) {
  if (view === "year") {
    return new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(date);
  }

  if (view === "month") {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(date);
  }

  if (view === "day") {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }

  const [startDate, endDate] = getWeekDays(date);

  return `${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(startDate)} - ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(endDate)}`;
}

function shiftDate(date: Date, view: CalendarView, direction: number) {
  const nextDate = new Date(date);

  if (view === "year") {
    nextDate.setFullYear(date.getFullYear() + direction);
  } else if (view === "month") {
    nextDate.setMonth(date.getMonth() + direction);
  } else if (view === "week") {
    nextDate.setDate(date.getDate() + direction * 7);
  } else {
    nextDate.setDate(date.getDate() + direction);
  }

  return nextDate;
}

export default function CalendarPage() {
  const today = new Date();
  const todayKey = formatDateInput(today);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [view, setView] = useState<CalendarView>("week");
  const [currentDate, setCurrentDate] = useState(today);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [lessonDate, setLessonDate] = useState(todayKey);
  const [studentId, setStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [isStudentMenuOpen, setIsStudentMenuOpen] = useState(false);
  const [title, setTitle] = useState(lessonOptions[0].label);
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState(() =>
    addMinutesToTime("16:00", lessonOptions[0].minutes),
  );
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState("");
  const [calendarError, setCalendarError] = useState("");
  const [draggingSessionId, setDraggingSessionId] = useState<number | null>(
    null,
  );
  const [resizingSession, setResizingSession] = useState<ResizeState | null>(
    null,
  );
  const [dropPreview, setDropPreview] = useState<DropPreview | null>(null);
  const resizingSessionRef = useRef<ResizeState | null>(null);

  useEffect(() => {
    fetchStudents();
    fetchSessions();
  }, []);

  useEffect(() => {
    resizingSessionRef.current = resizingSession;
  }, [resizingSession]);

  useEffect(() => {
    if (!resizingSession) {
      return;
    }

    function handleMouseMove(event: MouseEvent) {
      const activeResize = resizingSessionRef.current;
      const session = sessions.find(
        (currentSession) => currentSession.id === activeResize?.sessionId,
      );

      if (!activeResize || !session) {
        return;
      }

      const pointerOffset = Math.max(0, event.clientY - activeResize.columnTop);
      const rawMinutes =
        scheduleStartHour * 60 + (pointerOffset / hourSlotHeight) * 60;
      const minimumEndMinutes =
        getMinutesFromTime(session.startTime) + minLessonMinutes;
      const nextEndMinutes = Math.max(
        minimumEndMinutes,
        clampMinutes(snapMinutes(rawMinutes)),
      );

      const nextResize = {
        ...activeResize,
        previewEndTime: formatMinutesAsTime(nextEndMinutes),
      };

      resizingSessionRef.current = nextResize;
      setResizingSession(nextResize);
    }

    async function handleMouseUp() {
      const activeResize = resizingSessionRef.current;
      resizingSessionRef.current = null;
      setResizingSession(null);

      if (!activeResize) {
        return;
      }

      await resizeSessionTo(activeResize.sessionId, activeResize.previewEndTime);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizingSession, sessions]);

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
    return sessions.reduce<Record<string, ClassSession[]>>(
      (groupedSessions, session) => {
        const dateKey = getSessionDateKey(session);

        groupedSessions[dateKey] = [
          ...(groupedSessions[dateKey] ?? []),
          session,
        ].sort((first, second) => first.startTime.localeCompare(second.startTime));

        return groupedSessions;
      },
      {},
    );
  }, [sessions]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = studentSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return students;
    }

    return students.filter((student) =>
      getStudentFullName(student).toLowerCase().includes(normalizedSearch),
    );
  }, [students, studentSearch]);

  function resetForm(
    nextDate = formatDateInput(currentDate),
    nextStartTime = "16:00",
  ) {
    const selectedStudent =
      students.find((student) => String(student.id) === studentId) ??
      students[0];

    setEditingSessionId(null);
    setLessonDate(nextDate);
    setStudentId(String(selectedStudent?.id ?? ""));
    setStudentSearch(selectedStudent ? getStudentFullName(selectedStudent) : "");
    setTitle(lessonOptions[0].label);
    setStartTime(nextStartTime);
    setEndTime(addMinutesToTime(nextStartTime, lessonOptions[0].minutes));
    setNotes("");
    setError("");
  }

  function openAddLessonAt(date: Date, nextStartTime: string) {
    const dateKey = formatDateInput(date);

    if (
      hasTimeConflict(
        dateKey,
        nextStartTime,
        addMinutesToTime(nextStartTime, getLessonMinutes(title)),
      )
    ) {
      setCalendarError("That time range already has a lesson.");
      return;
    }

    resetForm(dateKey, nextStartTime);
    setCalendarError("");
    setIsModalOpen(true);
  }

  function openAddLesson(date: Date, hour: number) {
    openAddLessonAt(date, `${String(hour).padStart(2, "0")}:00`);
  }

  function openEditLesson(session: ClassSession) {
    const lessonOption = getLessonOptionLabel(session);

    setEditingSessionId(session.id);
    setLessonDate(getSessionDateKey(session));
    setCurrentDate(parseDateInput(getSessionDateKey(session)));
    setStudentId(String(session.studentId));
    setStudentSearch(getStudentFullName(session.student));
    setTitle(lessonOption);
    setStartTime(session.startTime);
    setEndTime(addMinutesToTime(session.startTime, getLessonMinutes(lessonOption)));
    setNotes(session.notes ?? "");
    setError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingSessionId(null);
    setError("");
  }

  function hasTimeConflict(
    dateKey: string,
    nextStartTime: string,
    nextEndTime: string,
    ignoredSessionId = editingSessionId,
  ) {
    return (sessionsByDate[dateKey] ?? []).some((session) => {
      if (session.id === ignoredSessionId) {
        return false;
      }

      return session.startTime < nextEndTime && session.endTime > nextStartTime;
    });
  }

  function selectStudent(student: Student) {
    setStudentId(String(student.id));
    setStudentSearch(getStudentFullName(student));
    setIsStudentMenuOpen(false);
  }

  function updateLessonTitle(nextTitle: string) {
    setTitle(nextTitle);
    setEndTime(addMinutesToTime(startTime, getLessonMinutes(nextTitle)));
  }

  function updateStartTime(nextStartTime: string) {
    setStartTime(nextStartTime);
    setEndTime(addMinutesToTime(nextStartTime, getLessonMinutes(title)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!studentId || !lessonDate || !title || !startTime || !endTime) {
      setError("Choose a student, date, lesson, and start time.");
      return;
    }

    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }

    if (hasTimeConflict(lessonDate, startTime, endTime)) {
      setError("Another lesson already uses this time range.");
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
          title,
          classDate: lessonDate,
          startTime,
          endTime,
          notes: notes.trim() || null,
        }),
      },
    );

    setIsSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(
        data?.error ??
          (editingSessionId
            ? "Could not update the lesson. Please try again."
            : "Could not save the lesson. Please try again."),
      );
      return;
    }

    setCurrentDate(parseDateInput(lessonDate));
    setCalendarError("");
    setIsModalOpen(false);
    setEditingSessionId(null);
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

    setSessions((currentSessions) =>
      currentSessions.filter((session) => session.id !== sessionId),
    );

    if (editingSessionId === sessionId) {
      closeModal();
    }
  }

  function startSessionDrag(
    event: DragEvent<HTMLElement>,
    session: ClassSession,
  ) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(session.id));
    setDraggingSessionId(session.id);
    setCalendarError("");
  }

  function getDraggedSession(event: DragEvent<HTMLElement>) {
    const sessionId = Number(event.dataTransfer.getData("text/plain"));

    return sessions.find((session) => session.id === sessionId) ?? null;
  }

  function getDropStartTime(event: DragEvent<HTMLElement>, targetHour: number) {
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = Math.max(0, event.clientY - rect.top);
    const rawMinutes = targetHour * 60 + (offset / rect.height) * 60;

    return formatMinutesAsTime(clampMinutes(snapMinutes(rawMinutes)));
  }

  function getClickStartTime(
    event: ReactMouseEvent<HTMLElement>,
    targetHour: number,
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = Math.max(0, event.clientY - rect.top);
    const rawMinutes = targetHour * 60 + (offset / rect.height) * 60;

    return formatMinutesAsTime(clampMinutes(snapMinutes(rawMinutes)));
  }

  function getColumnDropStartTime(event: DragEvent<HTMLElement>) {
    const column = event.currentTarget.closest("[data-calendar-column]");

    if (!column) {
      return null;
    }

    const rect = column.getBoundingClientRect();
    const offset = Math.max(0, event.clientY - rect.top);
    const rawMinutes =
      scheduleStartHour * 60 + (offset / hourSlotHeight) * 60;

    return formatMinutesAsTime(clampMinutes(snapMinutes(rawMinutes)));
  }

  function updateDropPreview(
    event: DragEvent<HTMLElement>,
    targetDate: Date,
    targetHour: number,
  ) {
    event.preventDefault();

    const session = getDraggedSession(event);

    if (!session) {
      return;
    }

    const duration = getMinutesBetweenTimes(session.startTime, session.endTime);
    const dateKey = formatDateInput(targetDate);
    const nextStartTime = getDropStartTime(event, targetHour);
    const nextEndTime = addMinutesToTime(nextStartTime, duration);

    setDropPreview({
      dateKey,
      startTime: nextStartTime,
      endTime: nextEndTime,
      hasConflict: hasTimeConflict(
        dateKey,
        nextStartTime,
        nextEndTime,
        session.id,
      ),
    });
  }

  function updateColumnDropPreview(
    event: DragEvent<HTMLElement>,
    targetDate: Date,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const session = getDraggedSession(event);
    const nextStartTime = getColumnDropStartTime(event);

    if (!session || !nextStartTime) {
      return;
    }

    const duration = getMinutesBetweenTimes(session.startTime, session.endTime);
    const dateKey = formatDateInput(targetDate);
    const nextEndTime = addMinutesToTime(nextStartTime, duration);

    setDropPreview({
      dateKey,
      startTime: nextStartTime,
      endTime: nextEndTime,
      hasConflict: hasTimeConflict(
        dateKey,
        nextStartTime,
        nextEndTime,
        session.id,
      ),
    });
  }

  function renderDropPreview(dateKey: string) {
    if (!dropPreview || dropPreview.dateKey !== dateKey) {
      return null;
    }

    return (
      <div
        className={[
          "pointer-events-none absolute left-2 right-2 z-20 rounded-md border-2 border-dashed px-2 py-1 text-xs font-semibold shadow-sm",
          dropPreview.hasConflict
            ? "border-red-400 bg-red-50 text-red-700"
            : "border-[#556b46] bg-[#f4f8ef] text-[#304326]",
        ].join(" ")}
        style={{
          top:
            ((getMinutesFromTime(dropPreview.startTime) -
              scheduleStartHour * 60) /
              60) *
            hourSlotHeight,
          height: Math.max(
            getSessionHeightFromTimes(dropPreview.startTime, dropPreview.endTime),
            34,
          ),
        }}
      >
        {dropPreview.startTime} - {dropPreview.endTime}
      </div>
    );
  }

  function getDisplayEndTime(session: ClassSession) {
    return resizingSession?.sessionId === session.id
      ? resizingSession.previewEndTime
      : session.endTime;
  }

  function beginResize(
    event: ReactMouseEvent<HTMLButtonElement>,
    session: ClassSession,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const column = event.currentTarget.closest("[data-calendar-column]");

    if (!column) {
      return;
    }

    const nextResize = {
      sessionId: session.id,
      columnTop: column.getBoundingClientRect().top,
      previewEndTime: session.endTime,
    };

    resizingSessionRef.current = nextResize;
    setResizingSession(nextResize);
  }

  async function resizeSessionTo(sessionId: number, nextEndTime: string) {
    const session = sessions.find(
      (currentSession) => currentSession.id === sessionId,
    );

    if (!session) {
      return;
    }

    const dateKey = getSessionDateKey(session);

    if (session.startTime >= nextEndTime) {
      setCalendarError("End time must be after start time.");
      return;
    }

    if (hasTimeConflict(dateKey, session.startTime, nextEndTime, session.id)) {
      setCalendarError("That time range already has a lesson.");
      return;
    }

    const res = await fetch(`/api/sessions/${session.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studentId: session.studentId,
        title: `${getMinutesBetweenTimes(session.startTime, nextEndTime)}min`,
        classDate: dateKey,
        startTime: session.startTime,
        endTime: nextEndTime,
        notes: session.notes,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setCalendarError(data?.error ?? "Could not resize the lesson.");
      return;
    }

    setCalendarError("");
    await fetchSessions();
  }

  async function moveSessionTo(
    event: DragEvent<HTMLElement>,
    targetDate: Date,
    targetHour?: number,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const session = getDraggedSession(event);

    if (!session) {
      setDraggingSessionId(null);
      setDropPreview(null);
      return;
    }

    const duration = getMinutesBetweenTimes(session.startTime, session.endTime);
    const nextDate = formatDateInput(targetDate);
    const nextStartTime =
      targetHour === undefined
        ? session.startTime
        : getDropStartTime(event, targetHour);
    const nextEndTime = addMinutesToTime(nextStartTime, duration);

    if (hasTimeConflict(nextDate, nextStartTime, nextEndTime, session.id)) {
      setCalendarError("That time range already has a lesson.");
      setDraggingSessionId(null);
      setDropPreview(null);
      return;
    }

    const res = await fetch(`/api/sessions/${session.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studentId: session.studentId,
        title: session.title,
        classDate: nextDate,
        startTime: nextStartTime,
        endTime: nextEndTime,
        notes: session.notes,
      }),
    });

    setDraggingSessionId(null);
    setDropPreview(null);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setCalendarError(data?.error ?? "Could not move the lesson.");
      return;
    }

    setCurrentDate(parseDateInput(nextDate));
    setCalendarError("");
    await fetchSessions();
  }

  async function moveSessionToColumnPosition(
    event: DragEvent<HTMLElement>,
    targetDate: Date,
  ) {
    event.preventDefault();
    event.stopPropagation();

    const session = getDraggedSession(event);
    const nextStartTime = getColumnDropStartTime(event);

    if (!session || !nextStartTime) {
      setDraggingSessionId(null);
      setDropPreview(null);
      return;
    }

    const duration = getMinutesBetweenTimes(session.startTime, session.endTime);
    const nextDate = formatDateInput(targetDate);
    const nextEndTime = addMinutesToTime(nextStartTime, duration);

    if (hasTimeConflict(nextDate, nextStartTime, nextEndTime, session.id)) {
      setCalendarError("That time range already has a lesson.");
      setDraggingSessionId(null);
      setDropPreview(null);
      return;
    }

    const res = await fetch(`/api/sessions/${session.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studentId: session.studentId,
        title: session.title,
        classDate: nextDate,
        startTime: nextStartTime,
        endTime: nextEndTime,
        notes: session.notes,
      }),
    });

    setDraggingSessionId(null);
    setDropPreview(null);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setCalendarError(data?.error ?? "Could not move the lesson.");
      return;
    }

    setCurrentDate(parseDateInput(nextDate));
    setCalendarError("");
    await fetchSessions();
  }

  function renderWeekView() {
    const weekDays = getWeekDays(currentDate);
    const timelineHeight = (scheduleEndHour - scheduleStartHour) * hourSlotHeight;

    return (
      <div className="overflow-auto rounded-lg border border-[#d7dbce] bg-white shadow-sm">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[5rem_repeat(7,minmax(7.5rem,1fr))] border-b border-[#e2e5dc] bg-[#f8f9f5]">
            <div />
            {weekDays.map((day) => {
              const dateKey = formatDateInput(day);
              const isToday = dateKey === todayKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => {
                    setCurrentDate(day);
                    setView("day");
                  }}
                  className={[
                    "px-3 py-3 text-center hover:bg-[#eef4e8]",
                    isToday ? "bg-[#e7efe0]" : "",
                  ].join(" ")}
                >
                  <p className="text-xs font-semibold uppercase text-[#68705f]">
                    {weekdays[day.getDay()]}
                  </p>
                  <p className="mt-1 text-lg font-semibold">{day.getDate()}</p>
                </button>
              );
            })}
          </div>

          <div
            className="grid grid-cols-[5rem_repeat(7,minmax(7.5rem,1fr))]"
            style={{ minHeight: timelineHeight }}
          >
            <div>
              {scheduleHours.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-r border-[#edf0e8] bg-[#fafbf7] px-2 py-3 text-right text-xs font-semibold text-[#68705f] last:border-b-0"
                  style={{ height: hourSlotHeight }}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {weekDays.map((day) => {
              const dateKey = formatDateInput(day);
              const daySessions = sessionsByDate[dateKey] ?? [];

              return (
                <div
                  key={dateKey}
                  data-calendar-column
                  className="relative border-r border-[#edf0e8] last:border-r-0"
                >
                  {scheduleHours.map((hour) => (
                    <div
                      key={`${dateKey}-${hour}`}
                      role="button"
                      tabIndex={0}
                      onClick={(event) =>
                        openAddLessonAt(day, getClickStartTime(event, hour))
                      }
                      onDragOver={(event) => updateDropPreview(event, day, hour)}
                      onDragLeave={() => setDropPreview(null)}
                      onDrop={(event) => moveSessionTo(event, day, hour)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openAddLesson(day, hour);
                        }
                      }}
                      className="cursor-pointer border-b border-[#edf0e8] transition hover:bg-[#f5f8f0] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#556b46] last:border-b-0"
                      style={{ height: hourSlotHeight }}
                    >
                      <span className="sr-only">
                        Add class at {formatHour(hour)}
                      </span>
                    </div>
                  ))}

                  {renderDropPreview(dateKey)}

                  {daySessions.map((session) => {
                    const displayEndTime = getDisplayEndTime(session);
                    const isCompact = isCompactSession(
                      session.startTime,
                      displayEndTime,
                    );

                    return (
                      <article
                        key={session.id}
                        draggable
                        onDragStart={(event) =>
                          startSessionDrag(event, session)
                        }
                        onDragEnd={() => {
                          setDraggingSessionId(null);
                          setDropPreview(null);
                        }}
                        onDragOver={(event) =>
                          updateColumnDropPreview(event, day)
                        }
                        onDrop={(event) =>
                          moveSessionToColumnPosition(event, day)
                        }
                        className="absolute left-1.5 right-1.5 z-10 rounded-md border border-[#9eb68d] bg-[#e7efe0] px-2 py-1.5 text-left text-xs text-[#304326] shadow-sm"
                        style={{
                          top: getSessionTop(session),
                          height: Math.max(
                            getSessionHeightFromTimes(
                              session.startTime,
                              displayEndTime,
                            ),
                            42,
                          ),
                          opacity: draggingSessionId === session.id ? 0.55 : 1,
                        }}
                      >
                        <div className="flex h-full flex-col gap-1 overflow-hidden">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-semibold">
                                {getStudentFullName(session.student)}
                                {isCompact ? (
                                  <span className="font-medium text-[#506247]">
                                    {" "}
                                    {session.startTime}
                                  </span>
                                ) : null}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => openEditLesson(session)}
                              className="shrink-0 rounded border border-[#b8c8ad] bg-white px-1.5 py-0.5 text-[11px] font-semibold text-[#394832] hover:bg-[#f7faf4]"
                            >
                              Edit
                            </button>
                          </div>
                          <p className="font-medium">
                            {isCompact
                              ? `Ends ${displayEndTime}`
                              : `${session.startTime} - ${displayEndTime}`}
                          </p>
                          <p className="text-[#65705c]">{session.title}</p>
                        </div>
                        <button
                          type="button"
                          aria-label="Resize lesson"
                          onMouseDown={(event) => beginResize(event, session)}
                          className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize rounded-b-md border-t border-[#9eb68d] bg-[#c7d9bc] hover:bg-[#b6cdaa]"
                        />
                      </article>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderDayView() {
    const dateKey = formatDateInput(currentDate);
    const daySessions = sessionsByDate[dateKey] ?? [];
    const timelineHeight = (scheduleEndHour - scheduleStartHour) * hourSlotHeight;

    return (
      <div className="overflow-hidden rounded-lg border border-[#d7dbce] bg-white shadow-sm">
        <div
          className="grid grid-cols-[5rem_1fr]"
          style={{ minHeight: timelineHeight }}
        >
          <div>
            {scheduleHours.map((hour) => (
              <div
                key={hour}
                className="border-b border-r border-[#edf0e8] bg-[#fafbf7] px-2 py-3 text-right text-xs font-semibold text-[#68705f] last:border-b-0"
                style={{ height: hourSlotHeight }}
              >
                {formatHour(hour)}
              </div>
            ))}
          </div>

          <div className="relative" data-calendar-column>
            {scheduleHours.map((hour) => (
              <button
                key={hour}
                type="button"
                onClick={(event) =>
                  openAddLessonAt(currentDate, getClickStartTime(event, hour))
                }
                onDragOver={(event) =>
                  updateDropPreview(event, currentDate, hour)
                }
                onDragLeave={() => setDropPreview(null)}
                onDrop={(event) => moveSessionTo(event, currentDate, hour)}
                className="block w-full border-b border-[#edf0e8] text-left transition hover:bg-[#f5f8f0] last:border-b-0"
                style={{ height: hourSlotHeight }}
              >
                <span className="sr-only">Add class at {formatHour(hour)}</span>
              </button>
            ))}

            {renderDropPreview(dateKey)}

            {daySessions.map((session) => {
              const displayEndTime = getDisplayEndTime(session);
              const isCompact = isCompactSession(
                session.startTime,
                displayEndTime,
              );

              return (
                <article
                  key={session.id}
                  draggable
                  onDragStart={(event) => startSessionDrag(event, session)}
                  onDragEnd={() => {
                    setDraggingSessionId(null);
                    setDropPreview(null);
                  }}
                  onDragOver={(event) =>
                    updateColumnDropPreview(event, currentDate)
                  }
                  onDrop={(event) =>
                    moveSessionToColumnPosition(event, currentDate)
                  }
                  className="absolute left-3 right-3 z-10 rounded-md border border-[#9eb68d] bg-[#e7efe0] px-3 py-2 text-left text-sm text-[#304326] shadow-sm"
                  style={{
                    top: getSessionTop(session),
                    height: Math.max(
                      getSessionHeightFromTimes(
                        session.startTime,
                        displayEndTime,
                      ),
                      42,
                    ),
                    opacity: draggingSessionId === session.id ? 0.55 : 1,
                  }}
                >
                  <div className="flex h-full items-start justify-between gap-3 overflow-hidden">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {getStudentFullName(session.student)}
                        {isCompact ? (
                          <span className="font-medium text-[#506247]">
                            {" "}
                            {session.startTime}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 font-medium">
                        {isCompact
                          ? `Ends ${displayEndTime}`
                          : `${session.startTime} - ${displayEndTime}`}
                      </p>
                      <p className="mt-0.5 text-xs text-[#65705c]">
                        {session.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditLesson(session)}
                      className="shrink-0 rounded border border-[#b8c8ad] bg-white px-2 py-1 text-xs font-semibold text-[#394832] hover:bg-[#f7faf4]"
                    >
                      Edit
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label="Resize lesson"
                    onMouseDown={(event) => beginResize(event, session)}
                    className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize rounded-b-md border-t border-[#9eb68d] bg-[#c7d9bc] hover:bg-[#b6cdaa]"
                  />
                </article>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderMonthView() {
    const monthDays = getMonthDays(currentDate);

    return (
      <section className="overflow-hidden rounded-lg border border-[#d7dbce] bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-[#e2e5dc] bg-[#f8f9f5]">
          {weekdays.map((weekday) => (
            <div
              key={weekday}
              className="px-2 py-3 text-center text-xs font-semibold uppercase text-[#68705f]"
            >
              {weekday}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {monthDays.map((day) => {
            const dateKey = formatDateInput(day);
            const daySessions = sessionsByDate[dateKey] ?? [];
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = dateKey === todayKey;

            return (
              <button
                key={dateKey}
                type="button"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => moveSessionTo(event, day)}
                onClick={() => {
                  setCurrentDate(day);
                  setView("day");
                }}
                className={[
                  "min-h-32 border-b border-r border-[#e5e7df] p-2 text-left transition hover:bg-[#f2f6ee]",
                  isCurrentMonth ? "bg-white" : "bg-[#fafaf7] text-[#9aa292]",
                ].join(" ")}
              >
                <span
                  className={[
                    "grid h-7 w-7 place-items-center rounded-full text-sm font-semibold",
                    isToday ? "bg-[#1f241c] text-white" : "",
                  ].join(" ")}
                >
                  {day.getDate()}
                </span>
                <div className="mt-2 space-y-1">
                  {daySessions.slice(0, 3).map((session) => (
                    <div
                      key={session.id}
                      draggable
                      onDragStart={(event) => startSessionDrag(event, session)}
                      onDragEnd={() => {
                        setDraggingSessionId(null);
                        setDropPreview(null);
                      }}
                      onClick={(event) => event.stopPropagation()}
                      className="truncate rounded bg-[#e7efe0] px-2 py-1 text-xs font-medium text-[#304326]"
                      style={{
                        opacity: draggingSessionId === session.id ? 0.55 : 1,
                      }}
                    >
                      {getStudentFullName(session.student)} {session.startTime}
                    </div>
                  ))}
                  {daySessions.length > 3 ? (
                    <p className="text-xs font-medium text-[#68705f]">
                      +{daySessions.length - 3} more
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  function renderYearView() {
    return (
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 12 }, (_, month) => {
          const monthDate = new Date(currentDate.getFullYear(), month, 1);
          const count = sessions.filter((session) => {
            const sessionDate = parseDateInput(getSessionDateKey(session));
            return (
              sessionDate.getFullYear() === currentDate.getFullYear() &&
              sessionDate.getMonth() === month
            );
          }).length;

          return (
            <button
              key={month}
              type="button"
              onClick={() => {
                setCurrentDate(monthDate);
                setView("month");
              }}
              className="rounded-lg border border-[#d7dbce] bg-white p-5 text-left shadow-sm transition hover:bg-[#f8faf4]"
            >
              <h2 className="text-lg font-semibold">
                {new Intl.DateTimeFormat("en-US", { month: "long" }).format(
                  monthDate,
                )}
              </h2>
              <p className="mt-2 text-sm font-medium text-[#68705f]">
                {count} lessons
              </p>
            </button>
          );
        })}
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f6f0] px-4 py-6 text-[#1f241c] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[100rem] space-y-5">
        <header className="rounded-lg border border-[#d7dbce] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href="/"
                className="mb-3 inline-flex h-9 items-center rounded-md border border-[#cfd4c5] px-3 text-sm font-semibold text-[#394832] hover:bg-[#f2f4ee]"
              >
                Home
              </Link>
              <h1 className="text-2xl font-semibold">Lesson calendar</h1>
              <p className="mt-1 text-sm text-[#65705c]">
                {formatViewTitle(currentDate, view)}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex rounded-md border border-[#cfd4c5] bg-[#f8f9f5] p-1">
                {calendarViews.map((calendarView) => (
                  <button
                    key={calendarView}
                    type="button"
                    onClick={() => setView(calendarView)}
                    className={[
                      "h-9 rounded px-3 text-sm font-semibold capitalize",
                      view === calendarView
                        ? "bg-[#1f241c] text-white"
                        : "text-[#394832] hover:bg-white",
                    ].join(" ")}
                  >
                    {calendarView}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentDate((date) => shiftDate(date, view, -1))
                  }
                  className="h-10 rounded-md border border-[#cfd4c5] px-3 text-sm font-medium hover:bg-[#f2f4ee]"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentDate(new Date())}
                  className="h-10 rounded-md border border-[#cfd4c5] px-3 text-sm font-medium hover:bg-[#f2f4ee]"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentDate((date) => shiftDate(date, view, 1))
                  }
                  className="h-10 rounded-md border border-[#cfd4c5] px-3 text-sm font-medium hover:bg-[#f2f4ee]"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </header>

        {view === "year" ? renderYearView() : null}
        {view === "month" ? renderMonthView() : null}
        {view === "week" ? renderWeekView() : null}
        {view === "day" ? renderDayView() : null}
        {calendarError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {calendarError}
          </p>
        ) : null}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 py-6">
          <section className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#68705f]">
                  {editingSessionId ? "Edit lesson" : "Add lesson"}
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {formatViewTitle(parseDateInput(lessonDate), "day")}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="h-9 rounded-md border border-[#cfd3c7] px-3 text-sm font-semibold hover:bg-[#f2f4ee]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium">
                Date
                <input
                  type="date"
                  value={lessonDate}
                  onChange={(e) => setLessonDate(e.target.value)}
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
                Lesson
                <select
                  value={title}
                  onChange={(e) => updateLessonTitle(e.target.value)}
                  className="h-10 rounded-md border border-[#cfd3c7] bg-white px-3 font-normal outline-none focus:border-[#53624b]"
                >
                  {lessonOptions.map((option) => (
                    <option key={option.label} value={option.label}>
                      {option.label}
                    </option>
                  ))}
                  {lessonOptions.every((option) => option.label !== title) ? (
                    <option value={title}>{title}</option>
                  ) : null}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-sm font-medium">
                  Start
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => updateStartTime(e.target.value)}
                    className="h-10 rounded-md border border-[#cfd3c7] px-3 font-normal outline-none focus:border-[#53624b]"
                  />
                </label>

                <label className="grid gap-1.5 text-sm font-medium">
                  End
                  <input
                    type="time"
                    value={endTime}
                    readOnly
                    className="h-10 rounded-md border border-[#cfd3c7] bg-[#f8f9f5] px-3 font-normal outline-none"
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

              {error ? (
                <p className="text-sm font-medium text-red-700">{error}</p>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
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
                    onClick={() => deleteSession(editingSessionId)}
                    disabled={deletingSessionId === editingSessionId}
                    className="h-10 rounded-md border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                  >
                    {deletingSessionId === editingSessionId
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-10 rounded-md border border-[#cfd3c7] px-4 text-sm font-semibold text-[#394832] hover:bg-[#f2f4ee]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
