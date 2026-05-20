# 📊 PollApp

![Angular](https://img.shields.io/badge/Angular-21-dd0031?logo=angular&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-realtime-3ecf8e?logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## What it does

PollApp lets you create and share surveys in seconds. Votes update live across all open tabs — no refresh needed.

- **Create** surveys with multiple questions and up to 6 answers each
- **Vote** on active surveys (one vote per browser session)
- **See results** as a live bar chart
- **Filter** by category or status (active / past)
- **Responsive** down to 320 px

---

## Stack

| Layer    | Tech                                   |
| -------- | -------------------------------------- |
| Frontend | Angular 21 · Signals · Reactive Forms  |
| Backend  | Supabase (PostgreSQL + Realtime + RLS) |

---

## Getting started

```bash
npm install
ng serve
```

Open `http://localhost:4200`.

## Production build

```bash
ng build --base-href=/your-deploy-path/
```

Output: `dist/pollapp/browser/`
