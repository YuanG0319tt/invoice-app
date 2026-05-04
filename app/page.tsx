"use client";

import { useMemo, useState } from "react";

type Lesson = {
  id: number;
  date: string;
  description: string;
  price: string;
};

const lessonOptions = [
  "Piano Lesson (60 min)",
  "Piano Lesson (45 min)",
  "Piano Lesson (30 min)",
] as const;

const initialLessons: Lesson[] = [
  { id: 1, date: "Apr 5", description: lessonOptions[0], price: "50" },
  { id: 2, date: "Apr 12", description: lessonOptions[0], price: "50" },
  { id: 3, date: "Apr 19", description: lessonOptions[0], price: "50" },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function Home() {
  const [studioName, setStudioName] = useState("XXX Music Studio");
  const [email, setEmail] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-001");
  const [invoiceDate, setInvoiceDate] = useState("May 1, 2026");
  const [dueDate, setDueDate] = useState("May 5, 2026");
  const [billTo, setBillTo] = useState("John Smith");
  const [paymentMethod, setPaymentMethod] = useState("Zelle: 123-456-7890");
  const [note, setNote] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);

  function parsePrice(price: string) {
    return Number.parseFloat(price) || 0;
  }

  const total = useMemo(
    () => lessons.reduce((sum, lesson) => sum + parsePrice(lesson.price), 0),
    [lessons],
  );

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
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="studio@example.com"
                className="h-10 rounded-md border border-[#cfd3c7] px-3 font-normal outline-none focus:border-[#53624b]"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1.5 text-sm font-medium">
                Date
                <input
                  value={invoiceDate}
                  onChange={(event) => setInvoiceDate(event.target.value)}
                  className="h-10 rounded-md border border-[#cfd3c7] px-3 font-normal outline-none focus:border-[#53624b]"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium">
                Due
                <input
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="h-10 rounded-md border border-[#cfd3c7] px-3 font-normal outline-none focus:border-[#53624b]"
                />
              </label>
            </div>
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
                  <div className="grid grid-cols-[86px_1fr_92px] gap-2">
                    <input
                      aria-label="Lesson date"
                      value={lesson.date}
                      onChange={(event) =>
                        updateLesson(lesson.id, "date", event.target.value)
                      }
                      placeholder="Apr 5"
                      className="h-9 rounded-md border border-[#cfd3c7] px-2 text-sm outline-none focus:border-[#53624b]"
                    />
                    <select
                      aria-label="Lesson description"
                      value={lesson.description}
                      onChange={(event) =>
                        updateLesson(
                          lesson.id,
                          "description",
                          event.target.value,
                        )
                      }
                      className="h-9 rounded-md border border-[#cfd3c7] bg-white px-2 text-sm outline-none focus:border-[#53624b]"
                    >
                      {lessonOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <input
                      aria-label="Lesson price"
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={lesson.price}
                      onChange={(event) =>
                        updateLesson(lesson.id, "price", event.target.value)
                      }
                      className="h-9 rounded-md border border-[#cfd3c7] px-2 text-sm outline-none focus:border-[#53624b]"
                    />
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

          <label className="grid gap-1.5 text-sm font-medium">
            Payment
            <input
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="h-10 rounded-md border border-[#cfd3c7] px-3 font-normal outline-none focus:border-[#53624b]"
            />
          </label>

          {/* <label className="grid gap-1.5 text-sm font-medium">
            Note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="resize-none rounded-md border border-[#cfd3c7] px-3 py-2 font-normal outline-none focus:border-[#53624b]"
            />
          </label> */}

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
                <p className="mt-2 text-[#555c50]">Email: {email}</p>
              </div>

              <div className="min-w-48 text-left sm:text-right">
                <p>
                  <span className="font-semibold">Invoice #:</span>{" "}
                  {invoiceNumber}
                </p>
                <p>
                  <span className="font-semibold">Date:</span> {invoiceDate}
                </p>
                <p>
                  <span className="font-semibold">Due:</span> {dueDate}
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
                    <p>{lesson.date}</p>
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
              <p>{paymentMethod}</p>
            </section>

            {/* <section className="mt-8">
              <p className="font-semibold">Note:</p>
              {note ? <p className="whitespace-pre-wrap">{note}</p> : null}
            </section> */}
          </article>
        </section>
      </div>
    </main>
  );
}
