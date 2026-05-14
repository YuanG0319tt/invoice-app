"use client";

import { useState } from "react";
import { type Student } from "./StudentTable";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface StudentFormProps {
  error: string;
  isSaving: boolean;
  onCreateStudent: (student: Omit<Student, "id">) => Promise<boolean>;
}

export default function StudentForm({
  error,
  isSaving,
  onCreateStudent,
}: StudentFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [validationError, setValidationError] = useState("");

  function handlePhoneChange(value: string) {
    const digitsOnly = value.replace(/\D/g, "");

    if (digitsOnly.length <= 10) {
      setPhone(digitsOnly);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const student = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
    };

    if (
      !student.firstName ||
      !student.lastName ||
      !student.email ||
      !student.phone
    ) {
      setValidationError("First name, last name, email, and phone are required.");
      return;
    }

    if (!emailPattern.test(student.email)) {
      setValidationError("Enter a valid email address.");
      return;
    }

    setValidationError("");
    const didCreateStudent = await onCreateStudent(student);

    if (didCreateStudent) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[#d8dbd2] bg-white p-5 shadow-sm"
    >
      <h2 className="text-lg font-semibold">Add student</h2>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-1.5 text-sm font-medium">
          First name
          <input
            placeholder="First name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className="h-10 rounded-md border border-[#cfd3c7] px-3 font-normal outline-none focus:border-[#53624b]"
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium">
          Last name
          <input
            placeholder="Last name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className="h-10 rounded-md border border-[#cfd3c7] px-3 font-normal outline-none focus:border-[#53624b]"
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium">
          Email
          <input
            type="email"
            placeholder="student@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-10 rounded-md border border-[#cfd3c7] px-3 font-normal outline-none focus:border-[#53624b]"
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium">
          Phone
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="5551234567"
            value={phone}
            onChange={(event) => handlePhoneChange(event.target.value)}
            className="h-10 rounded-md border border-[#cfd3c7] px-3 font-normal outline-none focus:border-[#53624b]"
          />
        </label>

        {validationError || error ? (
          <p className="rounded-md border border-[#efcaca] bg-[#fff7f7] px-3 py-2 text-sm font-medium text-[#8b2f2f]">
            {validationError || error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSaving}
          className="h-10 rounded-md bg-[#1f241c] px-4 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-[#9aa292]"
        >
          {isSaving ? "Adding..." : "Add student"}
        </button>
      </div>
    </form>
  );
}
