# System Architecture: Qubify

## 1. Architectural Principles

- **Frontend-Only Execution**: The application runs entirely within the client browser. No custom backend servers (Flask, Express, Django, FastAPI) are deployed.
- **Client-Side Quantum Simulation**: Circuit execution, state vector linear algebra, and Bloch sphere math run directly in TypeScript.
- **Persistent Storage via Google Sheets API v4**: Relational schema stored in 19 dedicated spreadsheet tabs using browser OAuth 2.0 bearer tokens.
- **AI Tutoring & Augmentation via Gemini**: Injects real circuit state, gates, error margins, and student history into context for intelligent feedback.
- **Google Sheets Users Directory**: User verification and role-based access control (Student, Instructor, Admin) are strictly driven by the Google Sheets Users tab.

## 2. Data Flow

```
[User Browser]
      │
      ├──> [Google Identity Services] ───> [Google Sheets API v4] (19 Tabs)
      │
      ├──> [Gemini API / Expert Engine] ──> [AI Study Companion & Progressive Hints]
      │
      ├──> [Browser Quantum Engine] ─────> [State Vector + Bloch Sphere + Probabilities]
      │
      └──> [Browser Storage Cache] ───────> [Circuits & Client Settings]
```

## 3. Core Modules

1. `src/quantum/`: Native complex arithmetic, state vector classes, gate implementations, NISQ noise model, backend abstraction, equivalence checkers.
2. `src/quantum/parser/`: Structured AST converter, tokenizer, bidirectional Qiskit generator and parser.
3. `src/services/google/`: Google Identity Services token manager, Google Sheets v4 CRUD helper.
4. `src/services/ai/`: Gemini chat client with context injection and progressive hint generation.
5. `src/context/`: Auth, Quantum, and Progress state management providers.
