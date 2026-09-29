# Google Sheets Database Connector Setup Guide

This guide describes how to connect the existing Google Spreadsheet **Quantum Learning Lab Database** (ID: `1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U`) so that user registrations and student records are written persistently into the **Users** tab.

---

## Why Google Apps Script?

- **No Student Google Sign-In Required**: Students register using their standard Qubify `Username` and `Password`. They do NOT need a Google account or Google permissions.
- **Direct Persistent Write**: The Apps Script runs with the permissions of the spreadsheet owner and directly appends rows into the `Users` tab.
- **Fast 60-Second Setup**: No complex Google Cloud OAuth screens or verification needed.

---

## 1. Open Your Spreadsheet
Open your spreadsheet in your browser:
[https://docs.google.com/spreadsheets/d/1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U/edit](https://docs.google.com/spreadsheets/d/1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U/edit)

Ensure the **Users** tab has the following 7 header columns in row 1:
```
UserId | Name | Username | Password | Role | Status | CreatedAt
```

---

## 2. Add the Script
1. In the Google Sheets top menu, click **Extensions** > **Apps Script**.
2. Delete any boilerplate code inside `Code.gs`.
3. Copy and paste the code from `/google-apps-script.js`.
4. Click the **Save** icon (disk icon).

---

## 3. Deploy as a Web App
1. Click the blue **Deploy** button (top right) > **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in the deployment settings:
   - **Description**: `Qubify Database Connector`
   - **Execute as**: `Me (<your-email>)`
   - **Who has access**: `Anyone` *(Crucial: this allows the Qubify app to submit new user registrations without requiring Google login)*
4. Click **Deploy**.
5. Grant permissions when prompted.
6. Copy the resulting **Web app URL** (ending in `/exec`).

---

## 4. Bind the URL in Qubify
You can set the Web app URL in either of two ways:

### Option A: In the Qubify Admin UI
1. Sign in to Qubify as admin (`admin` / `admin123`).
2. Go to **Admin Console** > **Platform Config**.
3. Paste your Web App URL into the **Google Apps Script Web App URL** field.
4. Click **Save Settings** and then **Test Connection**.

### Option B: In Environment Variables
Add to your `.env` file:
```env
VITE_GOOGLE_SHEETS_ID="1Lg7Z3Lh3YE2x-KvX2O7jNdcnP753z3PtQLR-tG8wU-U"
VITE_GOOGLE_APPS_SCRIPT_URL="https://script.google.com/macros/s/AKfycb.../exec"
```

---

## 5. Verification
1. Visit the `/register` page.
2. Enter a new username (e.g. `scholar1`) and valid password (e.g. `Quantum@2026`).
3. Click **Create Account**.
4. The user is appended directly to the **Users** tab on Google Sheets:
   `U004 | scholar1 | scholar1 | Quantum@2026 | STUDENT | Active | 2026-09-29`
