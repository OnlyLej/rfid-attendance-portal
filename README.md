# 📡 RFID Attendance Portal

A full-stack attendance management system for Philippine schools, built on ESP8266 RFID hardware, a Google Apps Script backend, and a Next.js web dashboard. Students tap their RFID card at the classroom door — attendance is logged, dashboards update, and parents are notified, all in under 200ms.

---

## ✨ Features

- **Real-time RFID scanning** — ESP8266 readers capture card UIDs instantly, with OLED and audio feedback at the device
- **Role-based access** — separate portals for teachers/admins and parents; parents see only their own child's records
- **Live dashboard** — animated stat cards, 7-day area charts, monthly trends, and per-class attendance rankings
- **Classroom monitor** — card grid showing every student's current IN / OUT / Absent status, updated live
- **Attendance logs** — filterable, sortable, paginated log table with date-range picker and full-text search
- **One-click Excel export** — formatted `.xlsx` with colour-coded statuses, auto-filters, and PH-timezone timestamps
- **Dark mode** — full dark/light toggle, persisted to `localStorage`
- **Session security** — 30-minute inactivity timeout with rotating session tokens
- **PH timezone native** — all timestamps parsed and displayed in `Asia/Manila` (UTC+8)
- **Mobile responsive** — bottom tab-bar navigation on small screens

---

## 🏗️ Architecture

```
┌─────────────────────┐     HTTPS / WiFi     ┌──────────────────────────┐
│   ESP8266 + RFID    │ ──────────────────▶  │  Google Apps Script API  │
│   RC522 Reader      │                       │  (Authentication +       │
│   OLED + Buzzer     │                       │   Data storage in        │
└─────────────────────┘                       │   Google Sheets)         │
                                              └────────────┬─────────────┘
                                                           │ JSON
                                                           ▼
                                              ┌──────────────────────────┐
                                              │   Next.js Web Portal     │
                                              │   /api/proxy  (backend)  │
                                              │   /api/auth   (sessions) │
                                              │   React frontend         │
                                              └──────────────────────────┘
```

### Layer breakdown

| Layer | Technology | Role |
|---|---|---|
| Hardware | ESP8266 NodeMCU + RC522 | Reads RFID UIDs, transmits over WiFi |
| Backend | Google Apps Script | Validates sessions, writes/reads Google Sheets |
| API proxy | Next.js Route Handlers | Forwards authenticated requests, hides GAS URL |
| Frontend | React (Next.js App Router) | Dashboard, logs, classroom monitor, parent portal |
| Charts | Recharts | Area, bar, and radial charts |
| Export | ExcelJS | Formatted `.xlsx` downloads |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Google account (for Apps Script + Sheets backend)
- ESP8266 development board + RC522 RFID module (for hardware)

### 1. Clone the repository

```bash
git clone https://github.com/your-org/rfid-attendance-portal.git
cd rfid-attendance-portal
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
# URL of your deployed Google Apps Script web app
GAS_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# Secret used to sign session tokens (generate with: openssl rand -hex 32)
SESSION_SECRET=your_session_secret_here
```

### 4. Deploy the Google Apps Script backend

1. Open [Google Apps Script](https://script.google.com) and create a new project
2. Copy the contents of `backend/Code.gs` into the editor
3. Set the following Script Properties (`Project Settings → Script Properties`):

| Property | Value |
|---|---|
| `SHEET_ID` | ID of your Google Sheets attendance spreadsheet |
| `SESSION_SECRET` | Same secret as `SESSION_SECRET` in `.env.local` |

4. Deploy as a **Web App** (execute as: Me, access: Anyone)
5. Copy the deployment URL into `GAS_API_URL`

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Build for production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/route.ts        # Login endpoint — validates credentials, issues session token
│   │   └── proxy/route.ts       # API proxy — forwards authenticated requests to GAS
│   └── page.tsx                 # Main React app (all UI components)
├── public/
│   └── favicon.ico
├── backend/
│   └── Code.gs                  # Google Apps Script source
├── hardware/
│   └── rfid_reader.ino          # Arduino sketch for ESP8266 + RC522
├── .env.local                   # Local environment variables (not committed)
└── README.md
```

---

## 🔐 Authentication & Security

- **Login** posts credentials to `/api/auth`, which validates against the GAS backend and returns a signed session token
- The token is stored in `sessionStorage` (cleared on tab close) and sent as both a query param and `X-Session-Token` header on every API call
- Sessions expire after **30 minutes of inactivity** — a client-side interval checks this and logs the user out automatically
- The GAS web app URL is never exposed to the browser; all requests are proxied through `/api/proxy`
- Role separation is enforced server-side: parent accounts can only query their linked student's records

---

## 👤 User Roles

### Teacher / Admin
- Full dashboard with live stats, charts, and weekly/monthly trends
- Classroom monitor — per-class IN/OUT/Absent breakdown
- Complete attendance log with filters, date range, and Excel export

### Parent
- Read-only view of their child's attendance history
- Today's log count, total records, and attendance rate
- Exportable to Excel

---

## 📊 Data Model

Attendance logs are stored in Google Sheets with the following columns:

| Column | Example | Notes |
|---|---|---|
| `timestamp` | `2025-02-21 14:30:00` | PH local time (UTC+8), no offset suffix |
| `studentId` | `2024-001` | Unique student identifier |
| `name` | `Juan dela Cruz` | Full name |
| `class` | `Grade 6 - Rizal` | Section/class name |
| `status` | `IN` / `OUT` | Most recent scan direction |

---

## 🛠️ Hardware Setup

### Components

- ESP8266 NodeMCU v3
- MFRC522 RC522 RFID reader module
- 128×64 OLED display (I²C, SSD1306)
- Passive buzzer
- RFID cards or key fobs (13.56 MHz / MIFARE)

### Wiring (RC522 → ESP8266)

| RC522 Pin | ESP8266 Pin |
|---|---|
| SDA | D8 (GPIO15) |
| SCK | D5 (GPIO14) |
| MOSI | D7 (GPIO13) |
| MISO | D6 (GPIO12) |
| RST | D3 (GPIO0) |
| 3.3V | 3V3 |
| GND | GND |

### Flashing the firmware

1. Install the [Arduino IDE](https://www.arduino.cc/en/software) and add the ESP8266 board package
2. Install libraries: `MFRC522`, `Adafruit SSD1306`, `ArduinoJson`, `ESP8266WiFi`, `ESP8266HTTPClient`
3. Open `hardware/rfid_reader.ino`
4. Set your WiFi credentials and GAS endpoint URL at the top of the file
5. Flash to the board

---

## ⚙️ API Reference

All requests go through `/api/proxy?action=<action>&sessionToken=<token>`.

| Action | Method | Description |
|---|---|---|
| `getDashboardStats` | GET | Returns students, logs, and computed stats for a date range |
| `getClasses` | GET | Returns list of unique class names |
| `getLogs` | GET | Returns paginated attendance logs with optional filters |

Authentication endpoint:

| Endpoint | Method | Body | Returns |
|---|---|---|---|
| `/api/auth` | POST | `{ username, password }` | `{ success, sessionToken, userType, fullName, … }` |

---

## 🌏 Timezone Handling

All timestamps from the backend are PH-local strings in the format `"yyyy-MM-dd HH:mm:ss"` with **no UTC offset**. The frontend parses these by appending `+08:00` before constructing a `Date` object, ensuring correct behaviour regardless of the browser's local timezone:

```ts
const parsePhTimestamp = (str: string) => {
  const iso = str.replace(' ', 'T') + '+08:00';
  return new Date(iso);
};
```

---

## 📦 Dependencies

| Package | Purpose |
|---|---|
| `next` | React framework and API routes |
| `react`, `react-dom` | UI library |
| `recharts` | Charts (area, bar, radial) |
| `exceljs` | Excel export |
| `lucide-react` | Icons |
| `tailwindcss` | Utility-first CSS |

---

## 🤝 Contributing

1. Fork the repo and create a feature branch: `git checkout -b feat/your-feature`
2. Commit your changes: `git commit -m 'feat: add your feature'`
3. Push and open a Pull Request

Please follow the existing code style — components are co-located in `page.tsx`, timezone helpers live at the top of the file, and all date comparisons use PH-local date strings.

---

## 📄 License

MIT © 2025 RFID Attendance Portal
