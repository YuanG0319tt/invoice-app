"use client";

interface StudentSearchProps {
  resultCount: number;
  searchQuery: string;
  totalCount: number;
  onSearchChange: (value: string) => void;
}

export default function StudentSearch({
  resultCount,
  searchQuery,
  totalCount,
  onSearchChange,
}: StudentSearchProps) {
  return (
    <section className="rounded-lg border border-[#d8dbd2] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="grid flex-1 gap-1.5 text-sm font-medium">
          Search students
          <input
            type="search"
            placeholder="Search by name, email, or phone"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-10 rounded-md border border-[#cfd3c7] px-3 font-normal outline-none focus:border-[#53624b]"
          />
        </label>

        <p className="text-sm font-medium text-[#65705c]">
          {resultCount} of {totalCount} shown
        </p>
      </div>
    </section>
  );
}
