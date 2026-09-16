# Reading-record

Student reading record application: pupils log books they have read (Chinese or English), with teacher and admin support for the MVP.

## Stack

**Next.js 15 (App Router) + TypeScript + Auth.js (NextAuth v5)**, with a server-side **Data Access Layer (DAL)** and a **Google Sheets** adapter (`googleapis`).

- Google **OAuth** for user login (student / teacher / admin).
- **Service account** for Sheets (secrets stay on the server).
- DAL interface lets us swap Sheets → Firebase later without rewriting business logic.

Legacy single-page prototype remains at `/legacy/my_reading_record_cloud_edition.html` (not the production auth/data design).

## What works in this step

| Piece | Location |
|-------|----------|
| Google OAuth (Auth.js) | `src/auth.ts`, `GET/POST /api/auth/*` |
| First login → User + Profile via DAL | `src/lib/auth/ensure-user.ts` |
| Bootstrap admin | `BOOTSTRAP_ADMIN_EMAIL` = `mangohk@gmail.com` → always `admin` |
| Role guards | `src/lib/auth/guards.ts`, middleware on `/student`, `/api/me`, `/api/settings`, `/api/student/*` |
| Student own-records scaffolding | `/student`, `GET /api/student/records` |
| Sheets SA credentials from env | `src/lib/dal/google-sheets.ts` |
| Health (graceful without secrets) | `GET /api/health` |

**Not yet:** full student create/edit form, teacher/admin UIs, role-admin screens.

## Prerequisites

1. Node.js 20+ and npm.
2. A Google Cloud project with **Google Sheets API** enabled.
3. A **service account** (JSON key); share the spreadsheet with that SA email (**Editor**).
4. An **OAuth 2.0 Web Client** for Google Sign-In.
5. Spreadsheet ID (already locked for MVP — see `.env.example`).

## Configure environment

```bash
cp .env.example .env.local
```

Never commit real client secrets or private keys (`.gitignore` blocks `.env*.local` and common key filenames).

### A. Service account → Sheets

1. [Google Cloud Console](https://console.cloud.google.com/) → select/create a project.
2. **APIs & Services → Library** → enable **Google Sheets API**.
3. **APIs & Services → Credentials → Create credentials → Service account**.
4. Open the service account → **Keys → Add key → JSON**; download the file.
5. Place it at `./secrets/service-account.json` (local) **or** paste fields into env (see below).
6. Open the spreadsheet  
   `https://docs.google.com/spreadsheets/d/1uRgIHMA8KIjRad6LkJbghXHXKMTcsdbkHdUQdDIvJHs/edit`  
   → **Share** → add the service account `client_email` as **Editor**.
7. Set **one** of these in `.env.local`:

| Mode | Env vars |
|------|----------|
| File path (local) | `GOOGLE_SERVICE_ACCOUNT_PATH=./secrets/service-account.json` (or `GOOGLE_APPLICATION_CREDENTIALS`) |
| Email + key | `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY` (use `\n` for newlines) |
| Inline JSON | `GOOGLE_SERVICE_ACCOUNT_JSON={...}` |
| Base64 JSON | `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=...` |

Also keep `SPREADSHEET_ID=1uRgIHMA8KIjRad6LkJbghXHXKMTcsdbkHdUQdDIvJHs`.

### B. Google OAuth (user login)

1. Same GCP project → **Credentials → Create credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Authorized JavaScript origins: `http://localhost:3000` (add your deploy origin later).
4. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`.
5. Copy Client ID / Client Secret into `.env.local`:

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

Auth.js v5 aliases also work: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `AUTH_URL`.

### C. Roles on first login

- `mangohk@gmail.com` → always **admin** (hardcoded bootstrap; written to Users).
- Other new Google accounts → provisional MVP default **student** (PRD still undecided on waitlist); Profile row created with empty grade / class_number.
- Teachers / extra admins: change `role` in the Users sheet (admin UI later).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Path | Notes |
|------|--------|
| `/` | Login button (if OAuth configured) |
| `/student` | Requires login; student sees own records scaffolding |
| `/api/health` | Public; reports OAuth/SA config + Settings when SA works |
| `/api/me` | Current session user |
| `/api/student/records` | Own records (students); `?userId=` for teacher/admin |
| `/api/settings` | Requires login |

Without secrets the app **still starts**: health returns `serviceAccountConfigured` / `oauthConfigured` false; login button is hidden until OAuth env is set.

```bash
npm run typecheck
npm run smoke
```

## Data model (Sheets)

- **Users:** `user_id`, `google_sub`, `email`, `display_name`, `role`
- **Profiles:** `user_id`, `grade`, `class_number`, `updated_at`
- **ReadingRecords:** `record_id`, `user_id`, `title`, `author`, `language`, `page_count`, `summary`, `read_date`, `points`, `created_at`
- **Settings:** scoring params (`page_threshold`, `points_zh_*`, `points_en_*`) — changing Settings must **not** recalculate existing `points`.

## Swapping to Firebase later

Implement the same `DataAccessLayer` interface and set `DATA_STORE=firebase` (adapter stub throws until implemented).
