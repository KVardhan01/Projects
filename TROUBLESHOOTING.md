# Troubleshooting Guide

### 1. Google OAuth "Error 400: redirect_uri_mismatch"
- Ensure `http://localhost:3000` or your Cloud Run URL is added under **Authorized JavaScript origins** in Google Cloud Console.

### 2. Google Sheets "Request had insufficient authentication scopes"
- Re-authenticate to ensure `https://www.googleapis.com/auth/spreadsheets` is granted.

### 3. Simulation Shows High Noise / Spurious Results
- Check the **NISQ Noise Model** panel. Toggle **Noise OFF** to restore pure state-vector evolution.

### 4. Qiskit Syntax Warning on Canvas
- Certain advanced operations (e.g. `qc.draw()`, custom Hamiltonian evolution) cannot be rendered on the 2D gate grid. The parser preserves them in AST without deleting.
