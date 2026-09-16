# Reading-record

Student reading record application: pupils log books they have read (Chinese or English), with teacher and admin support for the MVP.

## Stack choice (this foundation)

**Next.js 15 (App Router) + TypeScript**, with a server-side **Data Access Layer (DAL)** and a **Google Sheets** adapter (`googleapis`).

Why this stack for the MVP:

- Google **OAuth** for user login and a **service account** for Sheets both need a trusted server — Next.js Route Handlers keep secrets off the browser.
- DAL interface lets us swap Sheets → Firebase later without rewriting business logic.
- Simple to run locally (`npm run dev`) and deploy later (e.g. Node host / Vercel).

Legacy single-page prototype remains available; it is **not** the production auth/data design.

## Legacy prototype

`legacy/my_reading_record_cloud_edition.html` is the current student UI prototype being enhanced toward the MVP (see Project docs: PRD / project context). With the Next app running it is also served at:

`/legacy/my_reading_record_cloud_edition.html`

## What this foundation includes

| Piece | Location |
|-------|----------|
| DAL interface | `src/lib/dal/types.ts` |
| Google Sheets adapter | `src/lib/dal/google-sheets.ts` |
| DAL factory (`DATA_STORE`) | `src/lib/dal/index.ts` |
| Bootstrap admin + role sketch | `src/lib/auth/roles.ts` (`BOOTSTRAP_ADMIN_EMAIL` = `mangohk@gmail.com`) |
| Scoring helper (freeze points on save) | `src/lib/domain/scoring.ts` |
| Health API (reads Settings when credentials present) | `GET /api/health` |
| Settings API | `GET /api/settings` |
| Student page shell | `/student` |
| Env template (no secrets) | `.env.example` |

**Not in this PR:** full Google Sign-In UI, teacher/admin pages, writing reading records from the new UI.

## Prerequisites

1. Node.js 20+ and npm.
2. A Google Cloud project with **Google Sheets API** enabled.
3. A **service account** JSON key; share the spreadsheet with that service account email (**Editor**).
4. Spreadsheet ID (already locked for MVP — see `.env.example`).

## Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

- `SPREADSHEET_ID` — already filled with the MVP sheet ID.
- `GOOGLE_SERVICE_ACCOUNT_PATH` — path to your service account JSON (file must **not** be committed; `.gitignore` blocks common key filenames).
- Leave OAuth client fields empty until the auth step; placeholders are documented in `.env.example`.

Never commit real client secrets or private keys.

### Share the sheet with the service account

1. Open the service account JSON and note `client_email`.
2. In Google Sheets: Share → add that email as **Editor**.
3. Confirm tabs exist: `Users`, `Profiles`, `ReadingRecords`, `Settings` (structure already verified in Project docs).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- Home: product shell + links
- `/student`: thin student shell (繁中)
- `/legacy/my_reading_record_cloud_edition.html`: legacy prototype
- `/api/health`: reports whether Sheets credentials work; when they do, returns live **Settings**
- `/api/settings`: DAL `getSettings()`

Typecheck:

```bash
npm run typecheck
```

## Google OAuth (next step — not wired yet)

1. Google Cloud Console → APIs & Services → Credentials → **OAuth 2.0 Client ID** (Web).
2. Authorized redirect URI will follow the auth library chosen (e.g. Auth.js / NextAuth callback under `NEXTAUTH_URL`).
3. Put `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (and `NEXTAUTH_SECRET`) in `.env.local` only.
4. On login, call `resolveRole()` / `resolveUserRole()` so `mangohk@gmail.com` is always **admin**.

## Data model (Sheets)

Matches the locked PRD schema:

- **Users:** `user_id`, `google_sub`, `email`, `display_name`, `role`
- **Profiles:** `user_id`, `grade`, `class_number`, `updated_at`
- **ReadingRecords:** `record_id`, `user_id`, `title`, `author`, `language`, `page_count`, `summary`, `read_date`, `points`, `created_at`
- **Settings:** `key` / `value` scoring params (`page_threshold`, `points_zh_*`, `points_en_*`)

Changing Settings must **not** recalculate existing `points` on ReadingRecords.

## Swapping to Firebase later

Implement the same `DataAccessLayer` interface in a Firebase adapter and set `DATA_STORE=firebase` (adapter stub throws until implemented).
