# 📡 RFID Attendance Portal

A Next.js web dashboard for real-time school attendance tracking powered by a Google Apps Script backend.

---

## ⚙️ Environment Setup

Create a `.env.local` file in the project root:

```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

That's the only environment variable the portal needs. Both API routes read from it.

---

## 🔌 API Routes

### `POST /api/auth`

Authenticates a user against Google Apps Script and returns a session token.

**Request body:**
```json
{
  "username": "teacher01",
  "password": "yourpassword"
}
```

**Success `200`:**
```json
{
  "success": true,
  "sessionToken": "abc123...",
  "userType": "teacher",
  "fullName": "Juan dela Cruz",
  "username": "teacher01"
}
```

**Failure `401`:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### `GET /api/proxy`

Forwards authenticated requests to Google Apps Script.

**Required header:**
```
X-Session-Token: abc123...
```

**Query parameters:**

| Parameter | Required | Description |
|---|---|---|
| `action` | ✅ | GAS function to call (see actions below) |
| `sessionToken` | ✅ | Session token from login |
| `startDate` | ➖ | Filter start date — `yyyy-MM-dd` |
| `endDate` | ➖ | Filter end date — `yyyy-MM-dd` |

---

## 📋 Available Actions

Pass as the `action` query parameter to `/api/proxy`.

---

### `getDashboardStats`

Returns students, attendance logs, and computed stats for a date range.

```
GET /api/proxy?action=getDashboardStats&sessionToken=abc123&startDate=2025-01-01&endDate=2025-02-21
```

**Response:**
```json
{
  "success": true,
  "students": [
    { "studentId": "2024-001", "name": "Maria Santos", "class": "Grade 6 - Rizal" }
  ],
  "logs": [
    {
      "timestamp": "2025-02-21 08:14:00",
      "studentId": "2024-001",
      "name": "Maria Santos",
      "class": "Grade 6 - Rizal",
      "status": "IN"
    }
  ],
  "stats": {
    "totalStudents": 124,
    "presentToday": 108,
    "absentToday": 16,
    "attendanceRate": 87
  }
}
```

---

### `getClasses`

Returns a list of all class/section names.

```
GET /api/proxy?action=getClasses&sessionToken=abc123
```

**Response:**
```json
{
  "success": true,
  "classes": ["Grade 6 - Rizal", "Grade 6 - Bonifacio", "Grade 5 - Luna"]
}
```

---

## 🔐 How Authentication Works

```
1. Client POSTs credentials  →  /api/auth
2. /api/auth forwards        →  Google Apps Script (GAS validates, creates token)
3. Token returned            →  stored in client sessionStorage
4. Client sends token in X-Session-Token header on every request
5. /api/proxy forwards       →  GAS (validates token before returning data)
6. Token expires after 30 minutes of inactivity
```

The session token is created and validated entirely by Google Apps Script. The Next.js proxy never generates or stores tokens — it only checks that one exists before forwarding.

---

## 📝 Timestamp Format

All timestamps from the API are Philippine Standard Time (UTC+8), formatted as:

```
"2025-02-21 08:14:00"
```

No UTC offset is included. The portal handles this by appending `+08:00` at parse time.



## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/route.ts #  Login        
│   │   │  validates credentials, issues 
│   │   │   session token
│   │   └── proxy/route.ts     # Forwards 
│   │   authenticated requests to the GAS 
│   │   backend
│   └── page.tsx               # All UI 
│          components (dashboard, logs, 
│          monitor, parent view)
├── public/
│   └── favicon.ico
└── .env.local    # Local environment variables (not committed)
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

MIT © 2026 RFID Attendance Portal
