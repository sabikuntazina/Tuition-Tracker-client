import './globals.css';
import AppLayout from '@/components/layout/AppLayout';

export const metadata = {
  title: 'TuitionTrack — Personal Tuition Management System',
  description: 'Manage tutoring students, weekly schedules, completed classes, monthly tuition, and progress tracking.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="tuitiontrack">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
