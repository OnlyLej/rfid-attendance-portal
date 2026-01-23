import './globals.css'
import { Analytics } from "@vercel/analytics/next"

export const metadata = {
  title: 'RFID Attendance Portal',
  description: 'Secure attendance tracking for teachers and parents',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}
        <Analytics />
      </body>
    </html>
  )
}