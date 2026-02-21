# 📡 RFID Attendance Portal

A Next.js web dashboard for real-time school attendance tracking. Connects to an RFID hardware system and Google Apps Script backend to give teachers, admins, and parents live visibility into student attendance.

---

## ✨ Features

- **Live dashboard** — animated stat cards, 7-day trends, monthly charts, and per-class attendance rankings
- **Classroom monitor** — real-time IN / OUT / Absent status for every student, grouped by class
- **Attendance logs** — searchable, filterable, paginated log table with date-range selection
- **Excel export** — formatted `.xlsx` download with colour-coded statuses and PH-timezone timestamps
- **Parent portal** — read-only view scoped to a parent's linked child, with attendance rate stats
- **Dark / light mode** — persisted across sessions
- **Mobile responsive** — bottom tab-bar navigation on small screens
- **Session security** — 30-minute inactivity timeout with automatic logout

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A deployed Google Apps Script backend (provides the API and data storage)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
# URL of your deployed Google Apps Script web app
GAS_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# Secret used to sign session tokens (generate with: openssl rand -hex 32)
SESSION_SECRET=your_session_secret_here
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build for production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/route.ts      # Login — validates credentials, issues session token
│   │   └── proxy/route.ts     # Forwards authenticated requests to the GAS backend
│   └── page.tsx               # All UI components (dashboard, logs, monitor, parent view)
├── public/
│   └── favicon.ico
└── .env.local                 # Local environment variables (not committed)
```

---

## 👤 User Roles

### Teacher / Admin
- Dashboard with live stats, weekly/monthly charts, and class comparisons
- Classroom monitor with expandable per-class student status cards
- Full attendance log with filters, date range, and Excel export

### Parent
- Attendance history for their linked child only
- Today's log count, total records, and attendance rate
- Exportable to Excel

---

## 🔐 Authentication

- Credentials are validated via `/api/auth`, which returns a signed session token
- The token is stored in `sessionStorage` (cleared on tab close)
- All data requests are proxied through `/api/proxy` — the GAS backend URL is never exposed to the browser
- Sessions expire after **30 minutes of inactivity**

---

## 🌏 Timezone

All data is displayed in **Philippine Standard Time (UTC+8)**. Timestamps from the backend are parsed by appending `+08:00` before constructing a `Date` object, so the portal displays correctly regardless of the user's local timezone.

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `next` | React framework and API routes |
| `recharts` | Area, bar, and radial charts |
| `exceljs` | Excel export |
| `lucide-react` | Icons |
| `tailwindcss` | Styling |

---

## 📄 License

MIT © 2025 RFID Attendance Portal
