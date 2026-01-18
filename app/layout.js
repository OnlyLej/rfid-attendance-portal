import './globals.css'

export const metadata = {
  title: 'RFID Attendance Portal',
  description: 'Secure attendance tracking for teachers and parents',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}