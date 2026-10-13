# College Complaint Portal

A modular college grievance portal UI built with React and Vite from the supplied university-style design references.

## Current frontend modules
- Responsive homepage and shared navigation/footer
- About page and portal objectives
- Searchable grievance categories and category detail panel
- Complaint tracking form with explicit backend-not-connected messaging
- Student/admin role selection, login and registration UI
- Responsive styles, form labels and keyboard focus indicators

## Run locally
```bash
npm install
npm run dev
```

Build and preview:
```bash
npm run build
npm run preview
```

## Current limitations
This commit establishes the frontend foundation only. Login, registration, complaint tracking, database persistence, admin actions and file uploads are not connected to a backend. Do not use the current forms as real authentication or complaint submission.

## Planned milestones
1. Add React Router and protected routes.
2. Add Express API, MongoDB models and server-side validation.
3. Integrate authentication, roles and complaint status lifecycle.
4. Add tests, environment validation and deployment configuration.
