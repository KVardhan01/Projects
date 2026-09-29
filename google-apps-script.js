/**
 * ==============================================================================
 * QUBIFY DATABASE CONNECTOR - GOOGLE APPS SCRIPT
 * ==============================================================================
 *
 * Spreadsheet ID: 1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U
 * Primary Tab: Users (UserId | Name | Username | Password | Role | Status | CreatedAt)
 *
 * This Web App acts as the serverless backend between Qubify and Google Sheets:
 * - Direct registration of new users (checks duplicate username, assigns next UserId,
 *   enforces Role=STUDENT & Status=Active, appends row to Users tab)
 * - Safe reading of Users and platform data
 * - Zero Google OAuth required for students: Users authenticate with Username/Password
 *
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Open your Google Sheet in browser:
 *    https://docs.google.com/spreadsheets/d/1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U/edit
 * 2. In top menu: Extensions > Apps Script
 * 3. Delete existing code and paste this entire file.
 * 4. Click the blue "Deploy" button (top right) > "New deployment"
 * 5. Click the gear icon next to "Select type" and choose "Web app"
 * 6. Set deployment configuration:
 *    - Description: Qubify Database Connector
 *    - Execute as: Me (<your google email>)
 *    - Who has access: Anyone (allows Qubify to write without Google login)
 * 7. Click "Deploy", review and grant permissions.
 * 8. Copy the Web app URL (ends with /exec).
 * 9. Paste the URL into Qubify:
 *    - In .env file: VITE_GOOGLE_APPS_SCRIPT_URL="https://script.google.com/macros/s/.../exec"
 *    - OR in Admin Console > Platform Config > Google Apps Script Web App URL
 */

var SPREADSHEET_ID = '1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U';

/**
 * Handles HTTP GET requests from Qubify
 * - action=ping: Healthcheck
 * - action=checkUser & username=...: Checks if username already exists
 * - action=read / getUsers: Reads rows from Users or specified tab
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var action = params.action || 'read';
    var sheetId = params.sheetId || params.spreadsheetId || SPREADSHEET_ID;
    var tabName = params.tab || params.sheet || 'Users';

    if (action === 'ping') {
      return createJsonResponse({
        status: 'success',
        message: 'Qubify Google Apps Script Web App is active',
        timestamp: new Date().toISOString(),
      });
    }

    var ss = getSpreadsheet(sheetId);
    if (!ss) {
      return createJsonResponse({
        status: 'error',
        message: 'Spreadsheet not found or access denied for ID: ' + sheetId,
      });
    }

    var sheet = getSheet(ss, tabName);
    if (!sheet) {
      return createJsonResponse({
        status: 'error',
        message: 'Tab "' + tabName + '" not found in spreadsheet',
      });
    }

    var values = sheet.getDataRange().getValues();
    if (!values || values.length === 0) {
      return createJsonResponse({
        status: 'success',
        tab: sheet.getName(),
        headers: ['UserId', 'Name', 'Username', 'Password', 'Role', 'Status', 'CreatedAt'],
        rows: [],
      });
    }

    var headers = values[0];
    var rows = values.slice(1);

    // If checking duplicate username via GET
    if (action === 'checkUser' || action === 'checkUsername') {
      var checkUsername = (params.username || '').toString().trim().toLowerCase();
      var colMap = mapHeaders(headers);
      var userCol = colMap.hasOwnProperty('username') ? colMap['username'] : 2;
      var exists = false;

      for (var i = 0; i < rows.length; i++) {
        var u = rows[i][userCol] ? rows[i][userCol].toString().trim().toLowerCase() : '';
        if (u === checkUsername) {
          exists = true;
          break;
        }
      }

      return createJsonResponse({
        status: 'success',
        username: params.username,
        exists: exists,
      });
    }

    return createJsonResponse({
      status: 'success',
      tab: sheet.getName(),
      headers: headers,
      rows: rows,
    });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * Handles HTTP POST requests from Qubify
 * - action=register: Validates duplicate username, assigns next UserId, appends new row
 * - action=appendRow: Generic append for other tabs
 */
function doPost(e) {
  try {
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var action = payload.action || 'register';
    var sheetId = payload.spreadsheetId || payload.sheetId || SPREADSHEET_ID;
    var tabName = payload.tab || 'Users';

    var ss = getSpreadsheet(sheetId);
    if (!ss) {
      return createJsonResponse({
        status: 'error',
        error: 'Spreadsheet not found',
        message: 'Unable to open spreadsheet with ID: ' + sheetId,
      });
    }

    var sheet = getSheet(ss, tabName);
    if (!sheet) {
      return createJsonResponse({
        status: 'error',
        error: 'Tab not found',
        message: 'Tab "' + tabName + '" not found in spreadsheet',
      });
    }

    // =========================================================================
    // ACTION: REGISTER NEW USER
    // =========================================================================
    if (action === 'register' || action === 'registerUser') {
      var rawUsername = (payload.username || '').toString().trim();
      var rawPassword = (payload.password || '').toString();
      var rawName = (payload.name || rawUsername).toString().trim();

      if (!rawUsername) {
        return createJsonResponse({
          status: 'error',
          error: 'Username is required',
          message: 'Username is required',
        });
      }

      if (!rawPassword) {
        return createJsonResponse({
          status: 'error',
          error: 'Password is required',
          message: 'Password is required',
        });
      }

      // Ensure headers exist if sheet is empty
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['UserId', 'Name', 'Username', 'Password', 'Role', 'Status', 'CreatedAt']);
        SpreadsheetApp.flush();
      }

      var values = sheet.getDataRange().getValues();
      var headers = values.length > 0 ? values[0] : ['UserId', 'Name', 'Username', 'Password', 'Role', 'Status', 'CreatedAt'];
      var colMap = mapHeaders(headers);

      var userIdCol = colMap.hasOwnProperty('userid') ? colMap['userid'] : 0;
      var usernameCol = colMap.hasOwnProperty('username') ? colMap['username'] : 2;

      var checkTarget = rawUsername.toLowerCase();
      var maxUserNum = 0;

      // Check for duplicate username and determine next UserId
      for (var r = 1; r < values.length; r++) {
        var row = values[r];
        if (!row || row.length === 0) continue;

        var existingUser = row[usernameCol] ? row[usernameCol].toString().trim().toLowerCase() : '';
        if (existingUser === checkTarget) {
          // DUPLICATE USERNAME FOUND: Return exact required error response
          return createJsonResponse({
            status: 'error',
            error: 'User already exists',
            message: 'User already exists',
          });
        }

        // Track highest UserId number (e.g., U001, U002, U003 -> next is U004)
        var existingId = row[userIdCol] ? row[userIdCol].toString().trim() : '';
        var match = existingId.match(/^U(\d+)$/i);
        if (match) {
          var num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxUserNum) {
            maxUserNum = num;
          }
        }
      }

      // Generate next UserId (e.g., U004)
      var nextNum = maxUserNum + 1;
      var nextUserId = 'U' + ('000' + nextNum).slice(-3);

      // Date format: YYYY-MM-DD
      var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'UTC', 'yyyy-MM-dd');

      // Every user created through public registration automatically receives:
      // Role = STUDENT, Status = Active
      var newRow = [
        nextUserId,
        rawName || rawUsername,
        rawUsername,
        rawPassword,
        'STUDENT',
        'Active',
        today,
      ];

      // Append row to sheet (never overwrites an existing row)
      sheet.appendRow(newRow);
      SpreadsheetApp.flush();

      return createJsonResponse({
        status: 'success',
        success: true,
        message: 'Account created successfully',
        user: {
          userId: nextUserId,
          name: rawName || rawUsername,
          username: rawUsername,
          role: 'STUDENT',
          status: 'Active',
          createdAt: today,
        },
      });
    }

    // =========================================================================
    // ACTION: APPEND ROW (Generic)
    // =========================================================================
    if (action === 'appendRow' || action === 'append') {
      var appendRowData = payload.row;
      if (!Array.isArray(appendRowData)) {
        return createJsonResponse({
          status: 'error',
          error: 'Invalid payload',
          message: 'Payload "row" must be an array',
        });
      }

      sheet.appendRow(appendRowData);
      SpreadsheetApp.flush();

      return createJsonResponse({
        status: 'success',
        success: true,
        message: 'Row appended successfully to ' + sheet.getName(),
        row: appendRowData,
      });
    }

    return createJsonResponse({
      status: 'error',
      error: 'Unsupported action',
      message: 'Unsupported action: ' + action,
    });
  } catch (err) {
    return createJsonResponse({
      status: 'error',
      error: err.toString(),
      message: err.toString(),
    });
  }
}

/**
 * Opens spreadsheet by ID, with fallback to active spreadsheet
 */
function getSpreadsheet(id) {
  var targetId = id || SPREADSHEET_ID;
  if (targetId) {
    try {
      var ss = SpreadsheetApp.openById(targetId);
      if (ss) return ss;
    } catch (e) {
      // Container-bound script may not require openById
    }
  }
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    return null;
  }
}

/**
 * Finds sheet by name with case-insensitive matching
 */
function getSheet(ss, tabName) {
  if (!ss) return null;
  var target = tabName || 'Users';
  var sheet = ss.getSheetByName(target);
  if (sheet) return sheet;

  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().trim().toLowerCase() === target.trim().toLowerCase()) {
      return sheets[i];
    }
  }
  return sheets.length > 0 ? sheets[0] : null;
}

/**
 * Creates header column index lookup map
 */
function mapHeaders(headers) {
  var map = {};
  if (!headers || !Array.isArray(headers)) return map;
  for (var i = 0; i < headers.length; i++) {
    var key = headers[i] ? headers[i].toString().trim().toLowerCase().replace(/[\s_-]/g, '') : '';
    if (key) {
      map[key] = i;
    }
  }
  return map;
}

/**
 * Returns JSON response with CORS headers
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
