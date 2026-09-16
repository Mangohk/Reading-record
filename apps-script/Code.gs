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
 *
 * Soft-delete: action=soft_delete sets Timestamp to 20 years ago.
 * Listings skip rows whose Timestamp is older than 10 years (recovery backup).
 */

var SPREADSHEET_ID = '1uRgIHMA8KIjRad6LkJbghXHXKMTcsdbkHdUQdDIvJHs';
var SHEET_GID = 2141496446;
var ACTIVE_YEARS = 10;
var SOFT_DELETE_YEARS = 20;

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
    if (action === 'soft_delete') {
      return json_(softDeleteRecord_(params));
    }
    return json_({ ok: true, message: 'Reading Record API. Use action=submit, action=list, or action=soft_delete.' });
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

function activeCutoffDate_() {
  var cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - ACTIVE_YEARS);
  return cutoff;
}

function softDeleteTimestamp_() {
  var soft = new Date();
  soft.setFullYear(soft.getFullYear() - SOFT_DELETE_YEARS);
  return soft;
}

function parseSheetDate_(value) {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (value == null || value === '') return null;
  var d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
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
  var cutoff = activeCutoffDate_();

  var records = [];
  for (var i = values.length - 1; i >= 0; i--) {
    var r = values[i];
    var ts = parseSheetDate_(r[0]);
    // Soft-deleted / archived rows: Timestamp older than 10 years → hide from listings
    if (!ts || ts < cutoff) continue;

    var rec = {
      row: i + 2,
      timestamp: ts,
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

/**
 * Soft-delete: move Timestamp 20 years back so list filters hide the row.
 * Row stays in the sheet for manual recovery.
 */
function softDeleteRecord_(params) {
  var row = parseInt(params.row, 10);
  if (!row || row < 2 || isNaN(row)) {
    throw new Error('row is required (sheet row number >= 2)');
  }

  var sheet = getTargetSheet_();
  var lastRow = sheet.getLastRow();
  if (row > lastRow) {
    throw new Error('row out of range');
  }

  var expectedTitle = String(params.book_title || '').trim();
  if (expectedTitle) {
    var cellTitle = String(sheet.getRange(row, 5).getValue() || '').trim();
    if (cellTitle.toLowerCase() !== expectedTitle.toLowerCase()) {
      throw new Error('Row does not match book_title');
    }
  }

  var expectedStudent = String(params.student_name || '').trim();
  if (expectedStudent) {
    var cellStudent = String(sheet.getRange(row, 2).getValue() || '').trim();
    if (cellStudent.toLowerCase() !== expectedStudent.toLowerCase()) {
      throw new Error('Row does not match student_name');
    }
  }

  var softTs = softDeleteTimestamp_();
  sheet.getRange(row, 1).setValue(softTs);

  return {
    ok: true,
    soft_deleted: true,
    row: row,
    timestamp: softTs
  };
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
