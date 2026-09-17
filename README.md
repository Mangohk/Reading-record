# Reading Record (Simple Sheets)

A student reading-log page that appends book entries to a **Google Sheet** through an **Apps Script Web App** — the same pattern as teaching-games High Scores (`scores-api.js`).

No Firebase, no Next.js, no OAuth.

## Page link
https://mangohk.github.io/Reading-record/


## Visual base

`index.html` keeps the full Desktop Reading Record UX (student login, teacher portal, shelf/list library, book modal, ranks/stats, export, toasts). Firebase was removed; saves go through `ReadingRecordAPI` → Sheets.

## Files

| File | Role |
|------|------|
| `index.html` | Full Reading Record UI (Desktop base) + Sheets persistence |
| `reading-api.js` | Client: `GET` query-string calls to Apps Script |
| `apps-script/Code.gs` | Server: `doGet` → append / list rows |

## Quick start

1. Open `index.html` in a browser (double-click, or any static file server).
2. `reading-api.js` already points at the deployed Web App:

```js
var API_URL = 'https://script.google.com/macros/s/AKfycbyXNbBRDP0ad6ESbqjCBgBib28Gxs8WWCIaIVf0y-frm0AR73HwrgS-R-A7o3oLua6W/exec';
```

3. Log in as a student, add a book, and confirm a new row appears on the sheet.

## Deploy Apps Script as a Web App

1. Open [Google Apps Script](https://script.google.com/) → New project.
2. Paste the contents of `apps-script/Code.gs` into `Code.gs`.
3. Save → **Deploy** → **New deployment**.
4. Type: **Web app**.
5. Execute as: **Me**.
6. Who has access: **Anyone**.
7. Deploy → copy the `/exec` URL → set `API_URL` in `reading-api.js` (already set for the current deployment above).

The script must be owned by (or shared with) an account that can edit the target spreadsheet.

## Spreadsheet

- **Spreadsheet ID:** `1uRgIHMA8KIjRad6LkJbghXHXKMTcsdbkHdUQdDIvJHs`
- **Sheet gid:** `2141496446` (tab often named `book_records`)
- Headers on row 1 are currently empty; the Apps Script writes them on first submit if missing.

### Recommended headers (row 1)

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| Timestamp | Student Name | Class | Class No | Book Title | Author | Genre | Pages | Date Finished | Rating | Review |

## How it mirrors High Scores

| High Scores (`scores-api.js`) | Reading Record (`reading-api.js`) |
|-------------------------------|-----------------------------------|
| `GET …/exec?action=submit&game_id=…&player=…&score=…` | `GET …/exec?action=submit&student_name=…&book_title=…&…` |
| Response `{ ok: true, … }` | Same |
| Optional `action=list` | Optional `action=list` (+ `action=soft_delete`) |
| Apps Script appends a sheet row | Same |
| No secrets in the client URL beyond the public Web App endpoint | Same |

## Persistence notes

- **Save:** `handleFormSubmit` → `ReadingRecordAPI.saveRecord({ student_name, class_name, class_no, book_title, author, genre, pages, date_finished, rating, review })`, then re-fetch via `listRecords`.
- **Student bookshelf UI:** Google Sheet is the source of truth. On login/refresh, `ReadingRecordAPI.listRecords` for class + class no; empty Sheet results show an empty shelf (stale `localStorage` is not used for display).
- **Student refresh failure:** toast error; keep previous successful in-memory Sheet data if any, otherwise empty — never fall back to localStorage library cache.
- **Teacher dashboard:** `ReadingRecordAPI.listRecords`; if list fails, dashboard may be empty (toast).
- **Teacher soft-delete:** `ReadingRecordAPI.softDeleteRecord({ row, book_title, student_name })` sets the sheet **Timestamp** ~20 years back. Listings (server + client) skip rows older than **10 years**, so soft-deleted rows stay in the sheet for recovery but disappear from the UI.
- Student modal “delete” is session-only hide (Sheet rows stay; refresh may restore them).
- Re-saving / editing appends another Sheet row.
- There are **no API keys or secrets** in these files — only the public Web App `/exec` URL (same pattern as teaching-games high scores).
