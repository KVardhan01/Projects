/**
 * ==============================================================================
 * QUBIFY DATABASE CONNECTOR - GOOGLE APPS SCRIPT
 * ==============================================================================
 *
 * This Apps Script turns your Google Sheet ("Quantum Learning Lab Database",
 * ID: 1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U) into a secure, serverless
 * database for Qubify student registration and user management without forcing
 * students to log in with Google.
 *
 * SPREADSHEET TABS SUPPORTED:
 * - Users (Columns: UserId | Name | Username | Password | Role | Status | CreatedAt)
 *
 * HOW TO INSTALL IN 60 SECONDS:
 * 1. Open your Google Sheet in your web browser:
 *    https://docs.google.com/spreadsheets/d/1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U/edit
 * 2. In the top menu, click Extensions > Apps Script
 * 3. Delete any code in the editor, and paste this entire script.
 * 4. Click the blue "Deploy" button (top right) > "New deployment".
 * 5. Click the gear icon next to "Select type" and choose "Web app".
 * 6. Set the following options:
 *    - Description: Qubify Database API
 *    - Execute as: Me (your Google account)
 *    - Who has access: Anyone (allows registration to save users without Google login)
 * 7. Click "Deploy", review and grant permissions.
 * 8. Copy the "Web app URL" (looks like: https://script.google.com/macros/s/.../exec)
 * 9. Paste this URL into Qubify in Admin Console > Platform Config or in your .env file as:
 *    VITE_GOOGLE_APPS_SCRIPT_URL="https://script.google.com/macros/s/.../exec"
 */

function doGet(e) {
  try {
    const tabName = (e && e.parameter && (e.parameter.tab || e.parameter.sheet)) || 'Users';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(tabName);
    
    // Fallback search
    if (!sheet) {
      const sheets = ss.getSheets();
      sheet = sheets.find(function(s) {
        return s.getName().trim().toLowerCase() === tabName.trim().toLowerCase();
      }) || sheets[0];
    }
    
    if (!sheet) {
      return createJsonResponse({ status: 'error', message: 'Tab ' + tabName + ' not found' });
    }
    
    const values = sheet.getDataRange().getValues();
    if (!values || values.length === 0) {
      return createJsonResponse({ status: 'success', headers: [], rows: [] });
    }
    
    const headers = values[0];
    const rows = values.slice(1);
    
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

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        payload = { raw: e.postData.contents };
      }
    }
    
    const action = payload.action || 'appendRow';
    const tabName = payload.tab || 'Users';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(tabName);
    
    if (!sheet) {
      const sheets = ss.getSheets();
      sheet = sheets.find(function(s) {
        return s.getName().trim().toLowerCase() === tabName.trim().toLowerCase();
      }) || sheets[0];
    }
    
    if (!sheet) {
      return createJsonResponse({ status: 'error', message: 'Tab ' + tabName + ' not found' });
    }
    
    if (action === 'appendRow' || action === 'append') {
      const row = payload.row;
      if (!Array.isArray(row)) {
        return createJsonResponse({ status: 'error', message: 'Payload "row" must be an array' });
      }
      
      // Append row to the sheet
      sheet.appendRow(row);
      SpreadsheetApp.flush();
      
      return createJsonResponse({
        status: 'success',
        message: 'Row appended successfully to ' + sheet.getName(),
        row: row,
      });
    }
    
    return createJsonResponse({ status: 'error', message: 'Unsupported action: ' + action });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
