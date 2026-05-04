"use client";

import { useMemo, useState } from "react";

type Lesson = {
  id: number;
  date: string;
  description: string;
  price: string;
};

type PaymentMethod = "Zelle" | "Venmo" | "Cash" | "Check";

type PaymentOption = {
  enabled: boolean;
  details: string;
};

const lessonOptions = [
  "Piano Lesson (60 min)",
  "Piano Lesson (45 min)",
  "Piano Lesson (30 min)",
] as const;

const paymentOptions: PaymentMethod[] = ["Zelle", "Venmo", "Cash", "Check"];

const initialLessons: Lesson[] = [
  { id: 1, date: "2026-04-05", description: lessonOptions[0], price: "50" },
  { id: 2, date: "2026-04-12", description: lessonOptions[0], price: "50" },
  { id: 3, date: "2026-04-19", description: lessonOptions[0], price: "50" },
];

const initialPayments: Record<PaymentMethod, PaymentOption> = {
  Zelle: { enabled: true, details: "123-456-7890" },
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

export default function Home() {
  const [studioName, setStudioName] = useState("XXX Music Studio");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-001");
  const [invoiceDate, setInvoiceDate] = useState("2026-05-01");
  const [dueDate, setDueDate] = useState("2026-05-05");
  const [billTo, setBillTo] = useState("John Smith");
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

  function updateLesson(id: number, field: keyof Lesson, value: string) {
    setLessons((currentLessons) =>
      currentLessons.map((lesson) => {
        if (lesson.id !== id) {
          return lesson;
        }

        return {
          ...lesson,
          [field]: value,
        };
      }),
    );
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
      currentLessons.filter((lesson) => lesson.id !== id),
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
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#68705f]">
              Invoice Builder
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Lesson invoice</h1>
          </div>

          <div className="grid gap-4">
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
          <article className="mx-auto min-h-[11in] w-full max-w-[8.5in] bg-white p-8 text-[15px] leading-7 text-[#1d1f1b] sm:p-12 print:min-h-0 print:max-w-none print:p-0">
            <header className="mb-9 flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-3xl font-semibold tracking-normal">
                  {studioName}
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

            <section className="mb-8">
              <p className="font-semibold">Bill To:</p>
              <p>{billTo}</p>
            </section>

            <section className="border-y border-[#1d1f1b] py-3">
              <div className="grid gap-2">
                {lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="grid grid-cols-[72px_1fr_auto] gap-3"
                  >
                    <p>
                      {formatDate(lesson.date, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p>{lesson.description}</p>
                    <p className="text-right">
                      {currencyFormatter.format(parsePrice(lesson.price))}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-5 flex justify-end">
              <p className="text-xl font-semibold">
                Total: {currencyFormatter.format(total)}
              </p>
            </section>

            <section className="mt-10">
              <p className="font-semibold">Payment:</p>
              {selectedPayments.length > 0 ? (
                <div>
                  {selectedPayments.map((payment) => (
                    <p key={payment}>{payment}</p>
                  ))}
                </div>
              ) : (
                <p>No payment option selected</p>
              )}
            </section>

          </article>
        </section>
      </div>
    </main>
  );
}
