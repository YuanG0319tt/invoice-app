-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "new_Student" ("id", "firstName", "lastName", "email", "phone", "createdAt")
SELECT
    "id",
    CASE
        WHEN instr(trim("name"), ' ') = 0 THEN trim("name")
        ELSE substr(trim("name"), 1, instr(trim("name"), ' ') - 1)
    END,
    CASE
        WHEN instr(trim("name"), ' ') = 0 THEN ''
        ELSE trim(substr(trim("name"), instr(trim("name"), ' ') + 1))
    END,
    "email",
    "phone",
    "createdAt"
FROM "Student";

DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
