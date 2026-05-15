"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Lesson = {
  id: number;
  date: string;
  description: string;
  price: string;
  repeatSourceId?: number;
};

type PaymentMethod = "Zelle" | "Venmo" | "Cash" | "Check";

type PaymentOption = {
  enabled: boolean;
  details: string;
};

type InvoiceStyle = "classic" | "modern" | "elegant";

const lessonOptions = [
  "Piano Lesson (60 min)",
  "Piano Lesson (45 min)",
  "Piano Lesson (30 min)",
] as const;

const paymentOptions: PaymentMethod[] = ["Zelle", "Venmo", "Cash", "Check"];
const invoiceStyles: Array<{
  id: InvoiceStyle;
  label: string;
  description: string;
}> = [
  {
    id: "classic",
    label: "Classic",
    description: "Clean black and white studio invoice.",
  },
  {
    id: "modern",
    label: "Modern",
    description: "Structured layout with a strong header.",
  },
  {
    id: "elegant",
    label: "Elegant",
    description: "Soft color, refined spacing, polished sections.",
  },
];

const initialLessons: Lesson[] = [];

const initialPayments: Record<PaymentMethod, PaymentOption> = {
  Zelle: { enabled: false, details: "" },
  Venmo: { enabled: false, details: "" },
  Cash: { enabled: false, details: "" },
  Check: { enabled: false, details: "" },
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatDate(value: string, options: Intl.DateTimeFormatOptions) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-US", options).format(date);
}

function parseDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getNextLessonId(lessons: Lesson[]) {
  return lessons.reduce((nextId, lesson) => Math.max(nextId, lesson.id + 1), 1);
}

function buildRemainingMonthLessons(
  sourceLesson: Lesson,
  existingLessons: Lesson[],
  nextId: number,
) {
  const sourceDate = parseDateInput(sourceLesson.date);

  if (!sourceDate) {
    return [];
  }

  const lessons: Lesson[] = [];
  const existingDates = new Set(
    existingLessons
      .filter((lesson) => lesson.id !== sourceLesson.id)
      .map((lesson) => lesson.date),
  );
  const date = new Date(sourceDate);
  date.setDate(date.getDate() + 7);

  while (date.getMonth() === sourceDate.getMonth()) {
    const lessonDate = formatDateInput(date);

    if (existingDates.has(lessonDate)) {
      date.setDate(date.getDate() + 7);
      continue;
    }

    lessons.push({
      id: nextId,
      date: lessonDate,
      description: sourceLesson.description,
      price: sourceLesson.price,
      repeatSourceId: sourceLesson.id,
    });
    nextId += 1;
    date.setDate(date.getDate() + 7);
  }

  return lessons;
}

export default function InvoicePage() {
  const [invoiceStyle, setInvoiceStyle] = useState<InvoiceStyle>("modern");
  const [studioName, setStudioName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [billTo, setBillTo] = useState("");
  const [payments, setPayments] = useState(initialPayments);
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);

  function parsePrice(price: string) {
    return Number.parseFloat(price) || 0;
  }

  const total = useMemo(
    () => lessons.reduce((sum, lesson) => sum + parsePrice(lesson.price), 0),
    [lessons],
  );

  const selectedPayments = paymentOptions
    .filter((option) => payments[option].enabled)
    .map((option) => {
      const details = payments[option].details.trim();
      return details ? `${option}: ${details}` : option;
    });

  const previewClassName = [
    "mx-auto min-h-[11in] w-full max-w-[8.5in] bg-white text-[15px] print:min-h-0 print:max-w-none",
    invoiceStyle === "classic"
      ? "p-8 leading-7 text-[#1d1f1b] sm:p-12 print:p-0"
      : "",
    invoiceStyle === "modern"
      ? "overflow-hidden rounded-sm p-0 leading-6 text-[#1b1f22] print:rounded-none"
      : "",
    invoiceStyle === "elegant"
      ? "p-8 leading-7 text-[#253028] sm:p-12 print:p-0"
      : "",
  ].join(" ");

  const previewBodyClassName =
    invoiceStyle === "modern" ? "p-8 sm:p-12 print:p-0" : "";

  function updateLesson(id: number, field: keyof Lesson, value: string) {
    setLessons((currentLessons) => {
      const updatedLessons = currentLessons.map((lesson) => {
        if (lesson.id !== id) {
          return lesson;
        }

        return {
          ...lesson,
          [field]: value,
        };
      });

      const sourceLesson = updatedLessons.find((lesson) => lesson.id === id);

      if (
        !sourceLesson ||
        sourceLesson.repeatSourceId ||
        !["date", "description", "price"].includes(field)
      ) {
        return updatedLessons;
      }

      const lessonsWithoutGenerated = updatedLessons.filter(
        (lesson) => lesson.repeatSourceId !== id,
      );
      const generatedLessons = buildRemainingMonthLessons(
        sourceLesson,
        lessonsWithoutGenerated,
        getNextLessonId(lessonsWithoutGenerated),
      );

      return [...lessonsWithoutGenerated, ...generatedLessons];
    });
  }

  function addLesson() {
    setLessons((currentLessons) => [
      ...currentLessons,
      {
        id: Date.now(),
        date: "",
        description: lessonOptions[0],
        price: "",
      },
    ]);
  }

  function removeLesson(id: number) {
    setLessons((currentLessons) =>
      currentLessons.filter(
        (lesson) => lesson.id !== id && lesson.repeatSourceId !== id,
      ),
    );
  }

  function updatePayment(
    method: PaymentMethod,
    field: keyof PaymentOption,
    value: boolean | string,
  ) {
    setPayments((currentPayments) => ({
      ...currentPayments,
      [method]: {
        ...currentPayments[method],
        [field]: value,
      },
    }));
  }

  return (
    <main className="min-h-screen bg-[#f4f5f1] px-4 py-6 text-[#1d1f1b] sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[380px_1fr] print:block print:max-w-none">
        <section className="space-y-5 rounded-lg border border-[#d8dbd2] bg-white p-5 shadow-sm print:hidden">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex h-9 items-center rounded-md border border-[#cfd3c7] px-3 text-sm font-semibold text-[#394832] hover:bg-[#f2f4ee]"
            >
              Home
            </Link>
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#68705f]">
              Invoice Builder
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Lesson invoice</h1>
          </div>

          <div className="grid gap-4">
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">PDF style</legend>
              <div className="grid gap-2">
                {invoiceStyles.map((style) => (
                  <label
                    key={style.id}
                    className={[
                      "cursor-pointer rounded-md border p-3 text-sm transition",
                      invoiceStyle === style.id
                        ? "border-[#394832] bg-[#f2f4ee]"
                        : "border-[#d8dbd2] hover:bg-[#fafbf7]",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="invoiceStyle"
                      value={style.id}
                      checked={invoiceStyle === style.id}
                      onChange={() => setInvoiceStyle(style.id)}
                      className="sr-only"
                    />
                    <span className="font-semibold">{style.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#65705c]">
                      {style.description}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="grid gap-1.5 text-sm font-medium">
              Studio name
              <input
                value={studioName}
                onChange={(event) => setStudioName(event.target.value)}
                className="h-10 rounded-md border border-[#cfd3c7] px-3 font-normal outline-none focus:border-[#53624b]"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium">
              Invoice #
              <input
                value={invoiceNumber}
                onChange={(event) => setInvoiceNumber(event.target.value)}
                className="h-10 rounded-md border border-[#cfd3c7] px-3 font-normal outline-none focus:border-[#53624b]"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium">
              Bill to
              <input
                value={billTo}
                onChange={(event) => setBillTo(event.target.value)}
                className="h-10 rounded-md border border-[#cfd3c7] px-3 font-normal outline-none focus:border-[#53624b]"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium">
              Date
              <input
                type="date"
                value={invoiceDate}
                onChange={(event) => setInvoiceDate(event.target.value)}
                className="h-10 rounded-md border border-[#cfd3c7] px-3 font-normal outline-none focus:border-[#53624b]"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium">
              Due
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="h-10 rounded-md border border-[#cfd3c7] px-3 font-normal outline-none focus:border-[#53624b]"
              />
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Lessons</h2>
              <button
                type="button"
                onClick={addLesson}
                className="h-9 rounded-md bg-[#394832] px-3 text-sm font-medium text-white hover:bg-[#283324]"
              >
                Add
              </button>
            </div>

            <div className="space-y-3">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="grid gap-2 rounded-md border border-[#d8dbd2] p-3"
                >
                  <div className="grid gap-2">
                    <label className="grid gap-1.5 text-sm font-medium">
                      Date
                      <input
                        type="date"
                        value={lesson.date}
                        onChange={(event) =>
                          updateLesson(lesson.id, "date", event.target.value)
                        }
                        className="h-9 rounded-md border border-[#cfd3c7] px-2 font-normal outline-none focus:border-[#53624b]"
                      />
                    </label>

                    <label className="grid gap-1.5 text-sm font-medium">
                      Lesson
                      <select
                        value={lesson.description}
                        onChange={(event) =>
                          updateLesson(
                            lesson.id,
                            "description",
                            event.target.value,
                          )
                        }
                        className="h-9 rounded-md border border-[#cfd3c7] bg-white px-2 font-normal outline-none focus:border-[#53624b]"
                      >
                        {lessonOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-1.5 text-sm font-medium">
                      Price
                      <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={lesson.price}
                        onChange={(event) =>
                          updateLesson(lesson.id, "price", event.target.value)
                        }
                        className="h-9 rounded-md border border-[#cfd3c7] px-2 font-normal outline-none focus:border-[#53624b]"
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLesson(lesson.id)}
                    className="justify-self-start text-sm font-medium text-[#8b2f2f] hover:text-[#5f1717]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <h2 className="text-base font-semibold">Payment</h2>
            {paymentOptions.map((option) => (
              <div key={option} className="grid grid-cols-[86px_1fr] gap-2">
                <label className="flex h-10 items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={payments[option].enabled}
                    onChange={(event) =>
                      updatePayment(option, "enabled", event.target.checked)
                    }
                    className="size-4 accent-[#394832]"
                  />
                  {option}
                </label>
                <input
                  aria-label={`${option} payment information`}
                  value={payments[option].details}
                  onChange={(event) =>
                    updatePayment(option, "details", event.target.value)
                  }
                  placeholder={
                    option === "Check"
                      ? "Payable to..."
                      : option === "Cash"
                        ? "Cash payment note"
                        : "Account, phone, or username"
                  }
                  className="h-10 rounded-md border border-[#cfd3c7] px-3 text-sm outline-none focus:border-[#53624b]"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="h-11 w-full rounded-md bg-[#1d1f1b] px-4 text-sm font-semibold text-white hover:bg-black"
          >
            Print or Save PDF
          </button>
        </section>

        <section className="rounded-lg border border-[#d8dbd2] bg-white p-4 shadow-sm print:border-0 print:p-0 print:shadow-none">
          <article className={`invoice-print-page ${previewClassName}`}>
            {invoiceStyle === "modern" ? (
              <header className="bg-[#1f3429] px-8 py-9 text-white sm:px-12 print:px-0 print:pt-0">
                <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#cbd8c0]">
                      Invoice
                    </p>
                    <h2 className="mt-3 text-4xl font-semibold tracking-normal">
                      {studioName || "Studio name"}
                    </h2>
                  </div>
                  <div className="grid gap-1 text-sm sm:min-w-48 sm:text-right">
                    <p>#{invoiceNumber}</p>
                    <p>
                      {formatDate(invoiceDate, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p>
                      Due{" "}
                      {formatDate(dueDate, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </header>
            ) : null}

            <div className={previewBodyClassName}>
              {invoiceStyle !== "modern" ? (
                <header
                  className={[
                    "mb-9 flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between",
                    invoiceStyle === "elegant"
                      ? "border-b border-[#d7cfc1] pb-7"
                      : "",
                  ].join(" ")}
                >
                  <div>
                    <p
                      className={[
                        "text-xs font-semibold uppercase tracking-[0.22em]",
                        invoiceStyle === "elegant"
                          ? "text-[#8a6f47]"
                          : "text-[#65705c]",
                      ].join(" ")}
                    >
                      Invoice
                    </p>
                    <h2
                      className={[
                        "mt-2 font-semibold tracking-normal",
                        invoiceStyle === "elegant"
                          ? "text-4xl text-[#253028]"
                          : "text-3xl",
                      ].join(" ")}
                    >
                      {studioName || "Studio name"}
                    </h2>
                  </div>

                  <div className="min-w-48 text-left sm:text-right">
                    <p>
                      <span className="font-semibold">Invoice #:</span>{" "}
                      {invoiceNumber}
                    </p>
                    <p>
                      <span className="font-semibold">Date:</span>{" "}
                      {formatDate(invoiceDate, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    <p>
                      <span className="font-semibold">Due:</span>{" "}
                      {formatDate(dueDate, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </header>
              ) : null}

              <section
                className={[
                  "mb-8",
                  invoiceStyle === "modern"
                    ? "rounded-md bg-[#f4f7f2] p-4"
                    : "",
                  invoiceStyle === "elegant"
                    ? "rounded-md border border-[#ded4c4] bg-[#fbfaf7] p-4"
                    : "",
                ].join(" ")}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#65705c]">
                  Bill To
                </p>
                <p className="mt-1 text-lg font-semibold">{billTo}</p>
              </section>

              <section
                className={[
                  invoiceStyle === "classic"
                    ? "border-y border-[#1d1f1b] py-3"
                    : "",
                  invoiceStyle === "modern"
                    ? "overflow-hidden rounded-md border border-[#dbe3d5]"
                    : "",
                  invoiceStyle === "elegant"
                    ? "overflow-hidden rounded-md border border-[#ded4c4]"
                    : "",
                ].join(" ")}
              >
                {invoiceStyle !== "classic" ? (
                  <div
                    className={[
                      "grid grid-cols-[92px_1fr_auto] gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]",
                      invoiceStyle === "modern"
                        ? "bg-[#eef4e8] text-[#3f4c39]"
                        : "bg-[#f2ede4] text-[#745b37]",
                    ].join(" ")}
                  >
                    <p>Date</p>
                    <p>Lesson</p>
                    <p className="text-right">Amount</p>
                  </div>
                ) : null}

                <div
                  className={[
                    "grid",
                    invoiceStyle === "classic" ? "gap-2" : "divide-y divide-[#e5e7df]",
                  ].join(" ")}
                >
                  {lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={[
                        "grid grid-cols-[92px_1fr_auto] gap-3",
                        invoiceStyle === "classic" ? "" : "px-4 py-3",
                      ].join(" ")}
                    >
                      <p>
                        {formatDate(lesson.date, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p>{lesson.description}</p>
                      <p className="text-right font-medium">
                        {currencyFormatter.format(parsePrice(lesson.price))}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section
                className={[
                  "mt-6 flex justify-end",
                  invoiceStyle === "modern" || invoiceStyle === "elegant"
                    ? "border-t border-[#e2e5dc] pt-5"
                    : "",
                ].join(" ")}
              >
                <div
                  className={[
                    "min-w-56 text-right",
                    invoiceStyle === "modern"
                      ? "rounded-md bg-[#1f3429] px-5 py-4 text-white"
                      : "",
                    invoiceStyle === "elegant"
                      ? "rounded-md bg-[#f2ede4] px-5 py-4 text-[#253028]"
                      : "",
                  ].join(" ")}
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.16em]">
                    Total
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {currencyFormatter.format(total)}
                  </p>
                </div>
              </section>

              <section
                className={[
                  "mt-10",
                  invoiceStyle === "elegant"
                    ? "rounded-md border border-[#ded4c4] p-4"
                    : "",
                ].join(" ")}
              >
                <p className="font-semibold">Payment:</p>
                {selectedPayments.length > 0 ? (
                  <div className="mt-1">
                    {selectedPayments.map((payment) => (
                      <p key={payment}>{payment}</p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1">No payment option selected</p>
                )}
              </section>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
