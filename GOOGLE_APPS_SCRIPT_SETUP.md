# Qubify Google Sheets & Google Apps Script Database Integration

This document outlines the architecture, setup instructions, request/response formats, and testing procedure for connecting Qubify to your existing Google Spreadsheet using a Google Apps Script Web App.

---

## 1. Architecture & Security Flow

```
Qubify Registration (/register)
        ↓ (HTTP POST JSON / text-plain)
Google Apps Script Web App (/exec)
        ↓ (Apps Script SpreadsheetApp API)
Existing Google Spreadsheet (ID: 1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U)
        ↓
Users Tab (Columns: UserId | Name | Username | Password | Role | Status | CreatedAt)
        ↓
New User Row Appended (e.g. U004 | Pawan | Pawan | Pawan@123 | STUDENT | Active | 2026-09-29)
        ↓ (JSON Response: status: "success")
Qubify Registration Page shows: "Account created successfully" → Navigates to /login
```

### Key Security & Design Principles:
- **No Google OAuth for User Sign-In**: Qubify authentication strictly uses `Username` and `Password`. Users never see or need a Google account.
- **Zero Token Exposure**: No Google Access Tokens or account credentials reside in client browser bundles.
- **Serverless Bridge**: The Apps Script executes with the spreadsheet owner's permissions to safely check duplicates and write rows.

---

## 2. Complete Google Apps Script Code

The complete script is stored in `/google-apps-script.js`. Copy and paste this into your Google Apps Script editor:

```javascript
/**
 * Qubify Database Connector - Google Apps Script
 * Spreadsheet ID: 1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U
 * Target Tab: Users
 */

var SPREADSHEET_ID = '1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U';

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
        timestamp: new Date().toISOString()
      });
    }

    var ss = getSpreadsheet(sheetId);
    if (!ss) {
      return createJsonResponse({ status: 'error', message: 'Spreadsheet not found: ' + sheetId });
    }

    var sheet = getSheet(ss, tabName);
    if (!sheet) {
      return createJsonResponse({ status: 'error', message: 'Tab "' + tabName + '" not found' });
    }

    var values = sheet.getDataRange().getValues();
    if (!values || values.length === 0) {
      return createJsonResponse({
        status: 'success',
        tab: sheet.getName(),
        headers: ['UserId', 'Name', 'Username', 'Password', 'Role', 'Status', 'CreatedAt'],
        rows: []
      });
    }

    return createJsonResponse({
      status: 'success',
      tab: sheet.getName(),
      headers: values[0],
      rows: values.slice(1)
    });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

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
      return createJsonResponse({ status: 'error', error: 'Spreadsheet not found', message: 'Spreadsheet not found' });
    }

    var sheet = getSheet(ss, tabName);
    if (!sheet) {
      return createJsonResponse({ status: 'error', error: 'Tab not found', message: 'Users tab not found' });
    }

    // =========================================================================
    // REGISTRATION
    // =========================================================================
    if (action === 'register' || action === 'registerUser') {
      var rawUsername = (payload.username || '').toString().trim();
      var rawPassword = (payload.password || '').toString();
      var rawName = (payload.name || rawUsername).toString().trim();

      if (!rawUsername) {
        return createJsonResponse({ status: 'error', error: 'Username is required', message: 'Username is required' });
      }

      if (!rawPassword) {
        return createJsonResponse({ status: 'error', error: 'Password is required', message: 'Password is required' });
      }

      var values = sheet.getDataRange().getValues();
      var headers = values.length > 0 ? values[0] : ['UserId', 'Name', 'Username', 'Password', 'Role', 'Status', 'CreatedAt'];
      var colMap = mapHeaders(headers);

      var userIdCol = colMap.hasOwnProperty('userid') ? colMap['userid'] : 0;
      var usernameCol = colMap.hasOwnProperty('username') ? colMap['username'] : 2;

      var checkTarget = rawUsername.toLowerCase();
      var maxUserNum = 0;

      // 1. Check duplicate username & track next UserId sequence
      for (var r = 1; r < values.length; r++) {
        var row = values[r];
        if (!row || row.length === 0) continue;

        var existingUser = row[usernameCol] ? row[usernameCol].toString().trim().toLowerCase() : '';
        if (existingUser === checkTarget) {
          // DUPLICATE FOUND: Return exact required response
          return createJsonResponse({
            status: 'error',
            error: 'User already exists',
            message: 'User already exists'
          });
        }

        var existingId = row[userIdCol] ? row[userIdCol].toString().trim() : '';
        var match = existingId.match(/^U(\d+)$/i);
        if (match) {
          var num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxUserNum) {
            maxUserNum = num;
          }
        }
      }

      // 2. Generate Next UserId (e.g. U001, U002, U003 -> U004)
      var nextNum = maxUserNum + 1;
      var nextUserId = 'U' + ('000' + nextNum).slice(-3);

      var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'UTC', 'yyyy-MM-dd');

      // 3. New User Row Schema:
      // UserId | Name | Username | Password | Role=STUDENT | Status=Active | CreatedAt
      var newRow = [
        nextUserId,
        rawName || rawUsername,
        rawUsername,
        rawPassword,
        'STUDENT',
        'Active',
        today
      ];

      // 4. Append row (never overwrites existing rows)
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
          createdAt: today
        }
      });
    }

    // Generic appendRow fallback
    if (action === 'appendRow' || action === 'append') {
      if (!Array.isArray(payload.row)) {
        return createJsonResponse({ status: 'error', message: 'Payload "row" must be an array' });
      }
      sheet.appendRow(payload.row);
      SpreadsheetApp.flush();
      return createJsonResponse({ status: 'success', message: 'Row appended successfully', row: payload.row });
    }

    return createJsonResponse({ status: 'error', message: 'Unsupported action: ' + action });
  } catch (err) {
    return createJsonResponse({ status: 'error', error: err.toString(), message: err.toString() });
  }
}

function getSpreadsheet(id) {
  var targetId = id || SPREADSHEET_ID;
  if (targetId) {
    try {
      var ss = SpreadsheetApp.openById(targetId);
      if (ss) return ss;
    } catch (e) {}
  }
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    return null;
  }
}

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

function mapHeaders(headers) {
  var map = {};
  if (!headers || !Array.isArray(headers)) return map;
  for (var i = 0; i < headers.length; i++) {
    var key = headers[i] ? headers[i].toString().trim().toLowerCase().replace(/[\s_-]/g, '') : '';
    if (key) map[key] = i;
  }
  return map;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## 3. Exact Google Apps Script Deployment Settings

Follow these exact steps:

1. Open your Google Spreadsheet:
   [https://docs.google.com/spreadsheets/d/1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U/edit](https://docs.google.com/spreadsheets/d/1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U/edit)
2. In the top toolbar, click **Extensions** > **Apps Script**.
3. In the code editor (e.g. `Code.gs`), replace all contents with the code above.
4. Click the **Save** icon (disk icon).
5. At the top right, click **Deploy** > **New deployment**.
6. Click the gear icon next to "Select type" and select **Web app**.
7. Set the deployment fields:
   - **Description**: `Qubify Database Connector`
   - **Execute as**: `Me (<your Google email>)`
   - **Who has access**: `Anyone` *(CRITICAL: Must be "Anyone" so Qubify can post registrations without asking users to log into Google)*
8. Click **Deploy**.
9. When prompted, click **Authorize access**, select your Google account, click **Advanced** > **Go to Qubify Database Connector (unsafe)**, and click **Allow**.
10. Copy the generated **Web app URL** (ends in `/exec`).

---

## 4. Qubify Configuration

Configure the copied Web app URL into Qubify using either method:

### Method A: In Admin Console (Instant & in-browser)
1. Sign in to Qubify using default admin credentials:
   - Username: `admin`
   - Password: `admin123`
2. Navigate to `/admin` or click **Admin Console** > **Platform Config**.
3. In the **Google Apps Script Web App URL** input, paste your `/exec` URL.
4. Click **Save Configuration Changes**.
5. Click **Test Database Connection** to verify live connection to the `Users` tab.

### Method B: In Environment Configuration (`.env`)
Set the environment variable:
```env
VITE_GOOGLE_APPS_SCRIPT_URL="https://script.google.com/macros/s/AKfycb.../exec"
VITE_GOOGLE_SHEETS_ID="1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U"
```

---

## 5. Request & Response Format

### A. Registration Request (Qubify → Google Apps Script)
- **Method**: `POST`
- **Headers**: `'Content-Type': 'text/plain;charset=utf-8'` *(prevents browser CORS preflight OPTIONS rejection)*
- **Body**:
```json
{
  "action": "register",
  "spreadsheetId": "1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U",
  "tab": "Users",
  "username": "Pawan",
  "name": "Pawan",
  "password": "Pawan@123"
}
```

### B. Success Response (Google Apps Script → Qubify)
```json
{
  "status": "success",
  "success": true,
  "message": "Account created successfully",
  "user": {
    "userId": "U004",
    "name": "Pawan",
    "username": "Pawan",
    "role": "STUDENT",
    "status": "Active",
    "createdAt": "2026-09-29"
  }
}
```

### C. Duplicate Username Response
```json
{
  "status": "error",
  "error": "User already exists",
  "message": "User already exists"
}
```

---

## 6. Error Handling Guarantees

1. **Duplicate Username**:
   - If username exists in the Users sheet (case-insensitive check), returns `"User already exists"`.
   - No duplicate row is ever added.
2. **Password Validation**:
   - Client verifies: min 8 characters, uppercase, lowercase, number, special character.
   - Confirm password verifies exact match, returning `"Confirm password is different"`.
3. **Execution Failure**:
   - If the Apps Script Web App URL fails or returns an error, Qubify displays:
     `"Unable to create account. Please try again."`
   - The success banner `"Account created successfully"` is **ONLY** shown after Google Apps Script confirms the row was successfully written.

---

## 7. Step-by-Step Test Procedure

### Test 1: Successful Registration
1. Open Qubify and navigate to `/register`.
2. Enter:
   - Username: `Pawan`
   - Password: `Pawan@123`
   - Confirm Password: `Pawan@123`
3. Click the eye icons to verify password visibility toggles.
4. Click **Create Account**.
5. Apps Script receives the request, writes `U004 | Pawan | Pawan | Pawan@123 | STUDENT | Active | 2026-09-29` to the `Users` sheet.
6. Qubify navigates to `/login` with prefilled username `Pawan` and displays:
   `"Account created successfully"`.

### Test 2: Duplicate Username Protection
1. Navigate back to `/register`.
2. Enter the same username `Pawan`.
3. Enter valid passwords.
4. Click **Create Account**.
5. Apps Script identifies the duplicate username and returns:
   `"User already exists"`.
6. Qubify displays `"User already exists"` in the error banner. No duplicate row is added.

### Test 3: Login with Newly Created User
1. Navigate to `/login`.
2. Enter:
   - Username: `Pawan`
   - Password: `Pawan@123`
3. Click **Sign In**.
4. Qubify authenticates the user, reads `Role = STUDENT`, and routes to `/student/dashboard`.
