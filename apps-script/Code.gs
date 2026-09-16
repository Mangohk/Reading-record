/**
 * Reading Record — Apps Script Web App
 *
 * Deploy: Deploy → New deployment → Web app
 *   Execute as: Me
 *   Who has access: Anyone
 * Then paste the /exec URL into reading-api.js as API_URL.
 *
 * Spreadsheet: 1uRgIHMA8KIjRad6LkJbghXHXKMTcsdbkHdUQdDIvJHs
 * Target sheet gid: 2141496446 (tab name often book_records)
 */

var SPREADSHEET_ID = '1uRgIHMA8KIjRad6LkJbghXHXKMTcsdbkHdUQdDIvJHs';
var SHEET_GID = 2141496446;

var HEADERS = [
  'Timestamp',
  'Student Name',
  'Class',
  'Class No',
  'Book Title',
  'Author',
  'Genre',
  'Pages',
  'Date Finished',
  'Rating',
  'Review'
];

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = String(params.action || '').toLowerCase();

    if (action === 'submit') {
      return json_(submitRecord_(params));
    }
    if (action === 'list') {
      return json_(listRecords_(params));
    }
    return json_({ ok: true, message: 'Reading Record API. Use action=submit or action=list.' });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function getTargetSheet_() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === SHEET_GID) {
      return sheets[i];
    }
  }
  // Fallback by common tab name
  var byName = ss.getSheetByName('book_records');
  if (byName) return byName;
  throw new Error('Sheet with gid ' + SHEET_GID + ' not found');
}

function ensureHeaders_(sheet) {
  var row1 = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  var empty = row1.every(function (cell) {
    return cell === '' || cell == null;
  });
  if (empty || sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
}

function submitRecord_(params) {
  var studentName = String(params.student_name || '').trim();
  var className = String(params.class_name || '').trim();
  var classNo = String(params.class_no || '').trim();
  var title = String(params.book_title || '').trim();
  var author = String(params.author || '').trim();
  var genre = String(params.genre || '').trim();
  var pages = params.pages;
  var dateFinished = String(params.date_finished || '').trim();
  var rating = params.rating;
  var review = String(params.review || '').trim();

  if (!studentName) throw new Error('student_name is required');
  if (!title) throw new Error('book_title is required');

  var sheet = getTargetSheet_();
  ensureHeaders_(sheet);

  var row = [
    new Date(),
    studentName,
    className,
    classNo,
    title,
    author,
    genre,
    pages === '' || pages == null ? '' : Number(pages),
    dateFinished,
    rating === '' || rating == null ? '' : Number(rating),
    review
  ];

  sheet.appendRow(row);

  return {
    ok: true,
    saved: true,
    student_name: studentName,
    book_title: title
  };
}

function listRecords_(params) {
  var sheet = getTargetSheet_();
  ensureHeaders_(sheet);

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { ok: true, records: [] };
  }

  var values = sheet.getRange(2, 1, lastRow, HEADERS.length).getValues();
  var filterName = String(params.student_name || '').trim().toLowerCase();
  var filterClass = String(params.class_name || '').trim().toLowerCase();
  var filterNo = String(params.class_no || '').trim().toLowerCase();
  var limit = Math.min(Math.max(parseInt(params.limit, 10) || 50, 1), 200);

  var records = [];
  for (var i = values.length - 1; i >= 0; i--) {
    var r = values[i];
    var rec = {
      timestamp: r[0],
      student_name: r[1],
      class_name: r[2],
      class_no: r[3],
      book_title: r[4],
      author: r[5],
      genre: r[6],
      pages: r[7],
      date_finished: r[8],
      rating: r[9],
      review: r[10]
    };

    if (filterName && String(rec.student_name).toLowerCase() !== filterName) continue;
    if (filterClass && String(rec.class_name).toLowerCase() !== filterClass) continue;
    if (filterNo && String(rec.class_no).toLowerCase() !== filterNo) continue;

    records.push(rec);
    if (records.length >= limit) break;
  }

  return { ok: true, records: records };
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
