# Student Management App

A Next.js app for managing students, scheduling lessons, and creating printable lesson invoices.

## Getting Started

Install dependencies and generate the Prisma client:

```bash
npm install
npx prisma generate
```

Run the development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Database

The app uses Prisma with SQLite. The database URL is read from `.env`:

```bash
DATABASE_URL="file:./dev.db"
```

Apply database migrations with:

```bash
npx prisma migrate dev
```

## Scripts

```bash
npm run lint
npm run build
```
