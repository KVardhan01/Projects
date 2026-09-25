# Google Sheets as Persistent Database Setup Guide

This guide walks you through setting up Google Cloud and Google Sheets to act as the persistent backend database for **Qubify**. No backend server or service account private keys are required. All transactions use browser-based OAuth 2.0 with Google Identity Services.

---

## 1. Create a Google Cloud Project

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Select a project** > **New Project**.
3. Name your project (e.g., `qubify-app`) and click **Create**.

---

## 2. Enable the Google Sheets API

1. In the Google Cloud Console, open the left navigation menu and go to **APIs & Services** > **Library**.
2. Search for **Google Sheets API**.
3. Select **Google Sheets API** and click **Enable**.

---

## 3. Configure the OAuth Consent Screen

1. In **APIs & Services**, select **OAuth consent screen**.
2. Choose **External** user type and click **Create**.
3. Fill in the required fields:
   - **App name**: `Qubify`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. On the **Scopes** page, click **Add or Remove Scopes** and add:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
5. On the **Test users** page, add your Google account email so you can sign in during development.
6. Click **Save and Continue**.

---

## 4. Create an OAuth 2.0 Client ID

1. Go to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. Set **Application type** to **Web application**.
4. In **Authorized JavaScript origins**, add:
   - `http://localhost:3000`
   - Your production Cloud Run / hosting URL (e.g. `https://ais-dev-...run.app`)
5. Click **Create** and copy your **Client ID**.

---

## 5. Create the Master Spreadsheet & Tabs

1. Open [Google Sheets](https://sheets.new) to create a new spreadsheet.
2. Title it `Qubify Database`.
3. Create the following **19 tabs** (sheet names must match exactly):
   1. `Users`
   2. `Courses`
   3. `Modules`
   4. `Lessons`
   5. `Exercises`
   6. `Questions`
   7. `Circuits`
   8. `CircuitAttempts`
   9. `QuizAttempts`
   10. `LearningProgress`
   11. `LearningActivities`
   12. `Achievements`
   13. `UserAchievements`
   14. `AIConversations`
   15. `AIRecommendations`
   16. `Simulations`
   17. `Goals`
   18. `Feedback`
   19. `Notifications`
4. Copy the **Spreadsheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**`<SPREADSHEET_ID>`**`/edit`

---

## 6. Configure Environment Variables

Edit your `.env` file (or set via platform secrets):

```env
VITE_GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
VITE_GOOGLE_SHEETS_ID="your-spreadsheet-id"
VITE_GEMINI_API_KEY="your-gemini-api-key"
```

---

## 7. Run and Verify Connection

1. Start the app: `npm run dev`.
2. Click **Sign in with Google** on the top bar or login page.
3. Grant access to your spreadsheet.
4. Go to **Admin Console** > **Platform Config** and click **Test Connection** to verify read/write access.
