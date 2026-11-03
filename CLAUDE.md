# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

The app is **My Favorite Log**, a hobby log. Users keep records of movies (映画), books (読書) and outings (お出かけ) as cards. They can create, list, search, edit and delete records. Data lives only in browser LocalStorage. There is no auth and no server DB. The app will be deployed on Vercel.

All MVP features in the spec are implemented and covered by tests. The full spec is `my-favorite-log-requirements.md`, written in Japanese. It is the source of truth: read it before you change any behavior. When the spec and the code disagree, follow the spec.

## Development workflow

- Always design in Plan Mode before implementing anything.
- Present the design to the user, and implement only after the user has reviewed and approved it.
- Never start implementing without the user's explicit approval.
- If the spec is unclear or contradicts itself, ask the user. Do not resolve it by guessing.

## Commands

```bash
npm run dev      # dev server at http://localhost:3000 (Turbopack)
npm run build
npm run lint     # ESLint 9 flat config (eslint-config-next core-web-vitals + typescript)
npm test                              # run all tests (vitest run)
npx vitest run path/to/file.test.ts   # single file
npx vitest run -t "test name"         # single test by name
```

Vitest is configured in `vitest.config.mts`: jsdom environment, the `@/*` → `./*` alias, and `vitest.setup.ts`. The setup file loads jest-dom matchers and runs cleanup, `vi.restoreAllMocks()` and `localStorage.clear()` after each test. Tests live next to the code as `*.test.ts` / `*.test.tsx`. Component tests use Testing Library (`@testing-library/react`, `user-event`).

## Stack notes

- **Next.js 16.4 / React 19.3, App Router.** These versions may be newer than your training data. Version-matched docs ship in `node_modules/next/dist/docs/`. Check them before you use APIs you're unsure of. The root layout uses the global `LayoutProps<"/">` type, which is generated into `.next/types`.
- **Tailwind CSS v4** is wired through a Turbopack loader rule in `next.config.ts` (`@tailwindcss/turbopack`). There is no PostCSS config and no `tailwind.config.*`. Theme tokens (cream / sand / ink / star colors) are defined in `app/globals.css` under `@theme`. Shared component classes (`.input`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.field-error`) are there too, under `@layer components`.
- **Icons:** `lucide-react`, with Film = 映画, BookOpen = 読書 and MapPin = お出かけ.
- Design direction: simple and stylish, based on white and beige.
- `next dev` regenerates `AGENTS.md`. It is git-ignored on purpose.

## Code layout

- `lib/`: pure, React-free logic. Every module except `types.ts` has a unit test next to it.
  - `types.ts`: categories, the `LogRecord` type (managed fields) and `StoredRecord` (managed fields plus unknown extra fields), and `STORAGE_KEY`.
  - `date.ts`: real-date checks. Do **not** use `Date.UTC` or `new Date(y, …)`, because they map years 0–99 to the 1900s. Build the date with `setUTCFullYear` and compare the components.
  - `validation.ts`: corruption checks for the stored data.
  - `storage.ts`: `loadRecords` (read and validate), `writeRecords` (write) and `mutateRecords` (re-read, apply an operation, write). The storage rules below define how they must behave.
  - `form.ts`: form values, `validateForm` and `toManagedFields`.
  - `recordOps.ts`: build, edit and remove records. Edits preserve unknown extra fields.
  - `search.ts`, `tags.ts`, `format.ts`.
- `hooks/useRecords.ts`: the state store, built on `useSyncExternalStore`. The server snapshot is `loading`. The client reads LocalStorage lazily on its first snapshot. This avoids hydration mismatches and the `react-hooks/set-state-in-effect` lint rule. While the status is not `ready`, operations return `blocked` without writing.
- `components/`:
  - `FavoriteLogApp.tsx` is the client root. `app/page.tsx` only renders it. It holds the search and modal state and renders:
    - `StorageAlert`
    - `SearchPanel`
    - `RecordList`, which renders `RecordCard`
    - `RecordFormModal` (create and edit), which uses `TagInput` and `StarRatingInput`
    - `DeleteConfirmDialog`
  - Shared pieces:
    - `Modal`: the dialog shell.
    - `CategoryIcon`.
    - `StarRating.tsx`: `StarRatingInput` and `StarRatingDisplay`.
    - `messages.ts`: the error messages shown when a save or delete fails.

## Spec rules that shape the architecture

LocalStorage access touches browser APIs, so the persistence and UI layers must be client components, or must run only after mount. This avoids SSR and hydration mismatches.

**Storage (key `my-favorite-log-records`, a JSON array of records).** Strict validation is the core of the app. Keep it as pure, unit-testable functions, separate from React.

Field keys: `id`, `category` (the Japanese values `"映画"` / `"読書"` / `"お出かけ"`), `title`, `experienceDate`, `comment`, `rating`, `tags` and `createdAt`.

- Treat the data as corrupt if any of these is true:
  - It isn't valid JSON, or it isn't an array.
  - A required field (`id`, `category`, `title`, `createdAt`) is missing.
  - IDs are duplicated.
  - `id` or `title` is blank or whitespace-only.
  - The category is outside the 3 values.
  - A type is wrong. A present optional key holding `null` or `undefined` also counts.
  - `createdAt` is not a real UTC ISO date-time in the form `YYYY-MM-DDTHH:mm:ss(.sss)Z`.
  - The experience date is not a real `YYYY-MM-DD` date.
  - The comment is blank.
  - The rating is not an integer from 1 to 5.
  - `tags` is not a `string[]`, holds blank entries, or holds duplicates. Duplicates are checked after trimming each tag, so `["旅行", " 旅行"]` is corrupt. The comparison is case-sensitive.

  `tags: []` is valid. Unknown extra fields are **not** corruption. Validation never modifies the stored data.
- When the data is corrupt or the LocalStorage read fails:
  - The app itself must keep running. Show a warning or error message instead of crashing.
  - Show only the warning, not the "まだ記録がありません" message.
  - **Never delete, reset or overwrite the stored raw data**, and that includes writing `[]`.
  - Disable create, edit and delete, and suspend all saves. Keep them stopped until the corruption or read error is resolved and valid data has been confirmed.
  - The warning has a "再読み込み" button. It re-reads and re-validates without writing anything, and resumes operations only when the data is valid.
- Loading never writes. That includes a missing key: it means zero records, and `[]` is not written.
- Every save (create, edit, delete) re-reads and validates the storage first, then applies the change to that fresh data. If that fresh data is corrupt or unreadable, the save is aborted without writing. If the target record no longer exists, show "この記録は見つかりませんでした".
- When a save fails, tell the user. The app must keep running. Never delete, reset or overwrite existing data. On a failed save or delete, keep the modal open with its input and show the error inside it.
- Unknown extra fields (fields not defined in the spec's data items):
  - On load, they are not used by any app feature (display, search, sorting, etc.).
  - When an existing record is edited and saved, preserve its unknown extra fields and update only the managed fields.
  - New records contain only the defined fields.

**Record shape.**
- Optional fields (experience date, comment, rating, `tags`) are **omitted from the object** when empty. Never store them as `""`, `null`, `undefined` or `0`.
- Titles and comments are trimmed. A title that is empty after trimming is a validation error.
- `id` is a UUID and `createdAt` is a UTC ISO string. Both are set on create and never change on edit.
- The experience date is stored as `YYYY-MM-DD` and displayed as `YYYY/MM/DD`.
- Clicking the selected star again clears the rating.

**Tags.**
- Tags are trimmed, and empty tags are dropped. A duplicate tag within one record is checked after trimming and silently ignored. Matching is case-sensitive.
- When the user saves, text still left in the tag input is added as a tag under the same rules.
- "Existing tags" are derived from the records currently saved. They feed both the input autocomplete and the search tag list.
- When a tag is no longer used by any record, it must also be removed automatically from the active search selection.

**Search.** Conditions are combined with AND across category (すべて, meaning no filter, or one category), tags (OR among the selected tags) and keyword. The keyword is a case-insensitive substring match on the title or comment. Only leading and trailing whitespace is trimmed, both half-width and full-width. Inner spaces are kept and are part of the match. A whitespace-only keyword means no filter.

**List.** Records are sorted by `createdAt` descending. Cards never show `createdAt`. Show "まだ記録がありません" when there are zero records at all, and "条件に一致する記録がありません" when records exist but the filter matches none.

**UI flow.**
- There is a single list page with search at the top.
- The page opens modals for create ("新しい記録を追加"), edit and delete confirmation ("削除する" / "キャンセル").
- Show validation errors next to their fields. Cancel discards unsaved changes.
- In the create modal the category starts unselected. Saving without choosing one shows "カテゴリを選択してください".
- Modals do not close on a backdrop click. The Esc key acts as Cancel, for the delete confirmation too.
