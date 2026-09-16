(function (global) {
  'use strict';

  // Apps Script Web App URL (Anyone access) — same public /exec pattern as teaching-games high scores.
  var API_URL = 'https://script.google.com/macros/s/AKfycbza6iNOxnJllZTa0YOef3WbUrtxpnHAUijWPn4pzsKjpz_4WhzrWib0c65-bSToKXpA/exec';

  function queryString(params) {
    var parts = [];
    Object.keys(params).forEach(function (key) {
      var value = params[key];
      if (value == null || value === '') return;
      parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)));
    });
    return parts.join('&');
  }

  function trim(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  async function requestJson(url) {
    var response = await fetch(url);
    var data = await response.json();
    if (!data || data.ok === false) {
      throw new Error((data && data.error) || 'Reading record service error');
    }
    return data;
  }

  /**
   * Append one book record to Google Sheets via Apps Script.
   * Mirrors TeachingGamesScores.saveScore: GET ?action=submit&...
   */
  async function saveRecord(payload) {
    if (!API_URL || API_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
      throw new Error('Set API_URL in reading-api.js to your Apps Script Web App URL');
    }
    return requestJson(API_URL + '?' + queryString({
      action: 'submit',
      student_name: trim(payload.student_name || payload.studentName).slice(0, 80),
      class_name: trim(payload.class_name || payload.studentClass || payload.className).slice(0, 20),
      class_no: trim(payload.class_no || payload.classNo).slice(0, 10),
      book_title: trim(payload.book_title || payload.title).slice(0, 200),
      author: trim(payload.author).slice(0, 120),
      genre: trim(payload.genre).slice(0, 60),
      pages: payload.pages,
      date_finished: trim(payload.date_finished || payload.dateFinished),
      rating: payload.rating,
      review: trim(payload.review).slice(0, 2000)
    }));
  }

  /**
   * Optional: list recent records (action=list).
   */
  async function listRecords(options) {
    if (!API_URL || API_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
      throw new Error('Set API_URL in reading-api.js to your Apps Script Web App URL');
    }
    options = options || {};
    var data = await requestJson(API_URL + '?' + queryString({
      action: 'list',
      student_name: trim(options.student_name || options.studentName),
      class_name: trim(options.class_name || options.studentClass || options.className),
      class_no: trim(options.class_no || options.classNo),
      limit: options.limit || 50
    }));
    return data.records || [];
  }

  global.ReadingRecordAPI = {
    API_URL: API_URL,
    saveRecord: saveRecord,
    listRecords: listRecords
  };
})(window);
