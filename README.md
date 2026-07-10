# RFID Attendance Portal

A Next.js web dashboard for real-time school attendance tracking powered by a Google Apps Script backend.

---

## Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` with the following environment variables:
```env
ERROR_REPORT_TOKEN=your_error_report_token
NEXT_PUBLIC_ERROR_REPORT_TOKEN=your_public_error_report_token
DISCORD_WEBHOOK_URL=your_discord_webhook_url
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

**Required variables:**
- `GOOGLE_APPS_SCRIPT_URL`: Your Google Apps Script deployment URL (required for API functionality)

**Optional variables:**
- `ERROR_REPORT_TOKEN`: Token for error reporting service
- `NEXT_PUBLIC_ERROR_REPORT_TOKEN`: Public token for client-side error reporting
- `DISCORD_WEBHOOK_URL`: Discord webhook for error notifications

---

## Test API

A mock API is available for testing.

**Base URL:** `https://rfid-mock-api.lejematienzo.workers.dev`

To use it, set your `GOOGLE_APPS_SCRIPT_URL` in `.env.local` to the mock API URL:

```env
GOOGLE_APPS_SCRIPT_URL=https://rfid-mock-api.lejematienzo.workers.dev
```

### Test Credentials

| Username | Password | Role |
|---|---|---|
| `teacher1` | `test123` | Teacher |
| `parent1` | `test123` | Parent |

### Available Endpoints

**Login:**
```
POST /
Body: { "username": "teacher1", "password": "test123" }
```

**Dashboard Stats:**
```
GET /?action=getDashboardStats&sessionToken=mock-token
```

**Classes:**
```
GET /?action=getClasses&sessionToken=mock-token
```

> ⚠️ The test API returns static mock data only. It does not persist any changes.

---

## API Routes

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
| `action` | ✅ | function to call (see actions below) |
| `sessionToken` | ✅ession token from login |
| `startDate` | ➖ | Filt— `yyyy-MM-dd` |
| `endDate` | ➖date — `yyyy-MM-dd` |

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

##w Authentication Works

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

## Timestamp Format

All timestamps from the API are Philippine Standard Time (UTC+8), formatted as:

```
"2025-02-21 08:14:00"
```

No UTC offset is included. The portal handles this by appending `+08:00` at parse time.

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

## Timezone

The portal automatically detects your timezone from your IP address and displays all times accordingly. This means:

- **Display times** (timestamps, day names, dates) are shown in your detected timezone
- **Business logic** (late calculations, date comparisons) remains tied to Philippine Standard Time (UTC+8)
- **VPN support**: When using a VPN, times will display according to your VPN location

**How it works:**
1. On app load, the portal calls `ipapi.co` to detect timezone from your IP
2. The detected timezone is cached in localStorage for 24 hours to avoid repeated API calls
3. If the API fails, it falls back to your browser's timezone setting
4. All timestamps from the backend are Philippine Standard Time (UTC+8), formatted as `"2025-02-21 08:14:00"`
