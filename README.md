# TuitionTrack — Personal Tuition Management System

A modern, responsive, full-stack personal tuition management web application built for private tutors. **TuitionTrack** empowers you to effortlessly manage your students, dynamically generate weekly calendar schedules, mark completed classes, track tuition fees and partial payments, calculate monthly teaching progress based on exact calendar dates, and automatically receive celebratory notifications upon monthly quota completion.

Strictly designed for personal productivity with zero unnecessary login or registration overhead.

---

## 🌟 Key Features

### 1. Student Management
- **Add / Edit / View / Delete Students**: Store student name, phone number, address, monthly tuition fee, weekly class count, preferred weekdays, tuition start date, and optional notes.
- **Strict Weekday Schedule Validation**: Enforces that the count of selected class days matches the weekly frequency (e.g. 2 weekly classes requires selecting exactly 2 weekdays).
- **Search & Filter**: Search students in real-time by name, and filter by Active/Inactive status.

### 2. Dynamic Schedule Generation
- **Automatic Calendar Scheduling**: When a student is enrolled or updated, scheduled classes are automatically populated in the calendar.
- **Accurate Calendar Dates**: Schedules respect actual days in each month (28, 29, 30, or 31 days) without assuming fixed 4-week months.
- **Start Date Respected**: Classes are never scheduled or expected before the student's tuition start date, natively supporting mid-month joiners.
- **Duplicate Prevention**: Unique MongoDB compound indexes ensure duplicate class records can never be created for the same student on the same date.

### 3. Interactive FullCalendar
- **Multi-view Support**: Switch seamlessly between **Monthly**, **Weekly**, and **Daily** views.
- **Navigation Controls**: Previous month, Next month, and quick "Today" jump.
- **Student Filter**: Filter calendar sessions by individual student or view all students at once.
- **Professional Color System**:
  - 🔵 **Blue (`#2563EB`)**: Scheduled class
  - 🟢 **Green (`#16A34A`)**: Completed class
  - ⚪ **Gray (`#64748B`)**: Upcoming future scheduled class
  - 🔴 **Red (`#DC2626`)**: Cancelled or missed class
- **Interactive Modals**:
  - Click any class event to view details, mark as completed (persists completion timestamp), edit time/date/notes, or cancel.
  - Click any empty date on the calendar to schedule a session or directly log a completed class.

### 4. Monthly Tuition & Class Tracking
- **Accurate Expected Classes Calculation**: Counts exact matching weekdays in the selected month from the student's start date to the end of the month.
- **Remaining Classes**: Real-time counter of remaining classes until the target is met.
- **Status Indicator**: Automatically transitions between *Not Started*, *In Progress*, and *Monthly Classes Completed*.
- **Decoupled Billing & Attendance**: Completing classes does not prematurely mark tuition fees as paid.

### 5. Automatic Monthly Completion Notifications & Cron Job
- **Automated Milestone Alerts**: When a student completes all scheduled classes for a month, celebratory milestone notifications are issued (e.g. *"Rahim's October classes are completed. You have taught 8 out of 8 scheduled classes this month."*).
- **Background Cron Job (`node-cron`)**: Scheduled background task running on the Express backend periodically checks all active students independently of the frontend.
- **Real-Time Notification Trigger**: Also triggers immediately whenever a class completion marks the final required monthly session.
- **Duplicate Prevention**: MongoDB unique compound index ensures only one milestone notification is created per student per month.
- **Notification Management**: Mark as read, mark all read, delete, and manual completion re-check button.

### 6. Tuition Payment Tracking
- **Independent Payment Records**: Separate tuition billing from class attendance.
- **Partial & Full Payments Supported**:
  - Example: Monthly fee ৳3,000, Paid ৳2,000 → Remaining ৳1,000, Status: **Partial**.
- **Payment Metrics**: Instant summary cards for Total Collected, Total Expected, and Total Outstanding Dues.
- **Quick Full Payment**: 1-click button to auto-fill the full monthly fee.

### 7. Monthly Performance & Revenue Reports
- **Filterable Breakdown**: Select any Month and Year to inspect overall teaching and financial health.
- **Summary Metrics**: Expected Tuition, Collected Tuition, Outstanding Dues, and Total Classes Progress.
- **Student Breakdown Table**: Visual progress bars, completion percentages, payment status badges, and outstanding balances.
- **Print Ready**: 1-click "Print Report" formatted for clean export.

### 8. Executive Tutor Dashboard
- **7 Summary Cards**:
  1. Total Active Students
  2. Today's Scheduled Classes
  3. Today's Completed Classes
  4. This Month's Completed Classes
  5. This Month's Expected Classes
  6. Monthly Tuition Income (Collected vs Expected)
  7. Students with Completed Monthly Classes
- **Today's Classes Widget**: 1-click "Mark Completed" button directly from the dashboard.
- **Upcoming Schedule Widget**: Chronological list of next scheduled classes.
- **Student Monthly Progress Widget**: Clean progress bars and status indicators.
- **Recent Activity Log**: Aggregated audit log of newly enrolled students, finished classes, and recorded tuition payments.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, JavaScript (ESM), Tailwind CSS, DaisyUI, FullCalendar, Lucide React, Axios |
| **Backend** | Node.js (v18+ / v24), Express.js (ES Modules), MongoDB Node.js Driver (`mongodb`), `dotenv`, `cors`, `node-cron` |
| **Database** | MongoDB Atlas (Cloud Database) |

---

## 📁 Project Folder Structure

```text
Tuition-tracker/
├── package.json                          # Root convenience scripts
├── README.md                             # Full project documentation
│
├── tuition-track-server/                 # Express.js Backend Application
│   ├── .env                              # Backend environment secrets
│   ├── .env.example                      # Backend environment template
│   ├── package.json                      # Server dependencies & scripts
│   └── src/
│       ├── app.js                        # Express app & route configuration
│       ├── server.js                     # Server entrypoint & DB connection
│       ├── config/
│       │   └── db.js                     # MongoDB Atlas connection & index initialization
│       ├── controllers/
│       │   ├── studentController.js      # Student CRUD & schedule auto-gen
│       │   ├── classController.js        # Calendar class sessions & completion
│       │   ├── dashboardController.js    # Aggregated stats & activity feed
│       │   ├── paymentController.js      # Tuition payment tracking & balances
│       │   ├── notificationController.js # Milestone notifications
│       │   └── monthlySummaryController.js# Monthly progress & calculations
│       ├── routes/
│       │   ├── studentRoutes.js
│       │   ├── classRoutes.js
│       │   ├── dashboardRoutes.js
│       │   ├── paymentRoutes.js
│       │   ├── notificationRoutes.js
│       │   └── monthlySummaryRoutes.js
│       ├── services/
│       │   ├── scheduleService.js        # Scheduled date generator & schedule syncing
│       │   ├── notificationService.js    # Quota check & notification generator
│       │   └── monthlySummaryService.js  # Expected/completed class calculations
│       ├── jobs/
│       │   └── monthlyNotificationJob.js # Background cron task (node-cron)
│       ├── middleware/
│       │   └── errorMiddleware.js        # Centralized error & 404 handler
│       └── utils/
│           └── dateUtils.js              # Weekday & calendar date utilities
│
└── tuition-track-client/                 # Next.js 14 Frontend Application
    ├── .env.local                        # Frontend API endpoint config
    ├── package.json                      # Client dependencies & scripts
    ├── next.config.js                    # Next.js configuration
    ├── tailwind.config.js                # Custom Dark Navy & Blue theme palette
    ├── postcss.config.js
    ├── jsconfig.json                     # Path alias mapping (@/*)
    ├── app/
    │   ├── layout.js                     # Root layout with DaisyUI theme
    │   ├── page.js                       # Home redirect to /dashboard
    │   ├── globals.css                   # Tailwind directives & FullCalendar styling
    │   ├── dashboard/page.js             # Executive dashboard
    │   ├── students/page.js              # Student directory & management
    │   ├── calendar/page.js              # FullCalendar interactive schedule
    │   ├── reports/page.js               # Monthly performance & revenue report
    │   ├── payments/page.js              # Tuition collections & dues tracker
    │   └── notifications/page.js         # Milestone notification center
    ├── components/
    │   ├── layout/
    │   │   ├── AppLayout.js              # Responsive layout container
    │   │   ├── Sidebar.js                # Collapsible navigation drawer
    │   │   └── Navbar.js                 # Topbar with unread notification badge
    │   ├── students/
    │   │   ├── StudentFormModal.js       # Add/Edit student with weekday selector
    │   │   └── StudentDetailModal.js     # Student profile & schedule modal
    │   ├── calendar/
    │   │   ├── ClassDetailModal.js       # Class session action modal
    │   │   └── ScheduleClassModal.js     # New class scheduling modal
    │   ├── payments/
    │   │   └── PaymentModal.js           # Record/Edit tuition payment modal
    │   └── ui/
    │       └── Toast.js                  # Global alert toast
    └── services/
        ├── api.js                        # Axios base instance & interceptors
        ├── studentService.js
        ├── classService.js
        ├── dashboardService.js
        ├── paymentService.js
        ├── notificationService.js
        └── reportService.js
```

---

## ⚙️ Environment Variables

### Backend (`tuition-track-server/.env`)
```env
MONGODB_URI=mongodb+srv://tazinasabikun_db_user:blBCSkGR9hzGXmEo@cluster0.hnrkcst.mongodb.net/?appName=Cluster0
MONGODB_DB=TuitionTrack
PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (`tuition-track-client/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

### 1. Backend Setup
```bash
# Navigate to backend directory
cd tuition-track-server

# Install dependencies
npm install

# Start development server
npm run dev
```
The backend will launch at `http://localhost:5000`. You should see:
```text
Connected to MongoDB Atlas: database "TuitionTrack"
MongoDB indexes initialized successfully
Initializing monthly notification background cron job...
TuitionTrack Backend Server running on port 5000
```

### 2. Frontend Setup
In a new terminal window:
```bash
# Navigate to frontend directory
cd tuition-track-client

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
Open your browser and navigate to **`http://localhost:3000`**. It will automatically redirect to the Dashboard (`/dashboard`).

---

## 📡 REST API Reference

### 1. Student APIs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/students` | Get all students (supports `?search=name&status=active`) |
| `GET` | `/api/students/:id` | Get student by ID |
| `POST` | `/api/students` | Create student and auto-generate calendar schedule |
| `PUT` | `/api/students/:id` | Update student details and sync future schedules |
| `DELETE` | `/api/students/:id` | Delete student and clean up future scheduled classes |

#### Sample Create Student Payload (`POST /api/students`):
```json
{
  "name": "Rahim",
  "phone": "01712345678",
  "monthlyFee": 3000,
  "weeklyClasses": 2,
  "classDays": [0, 2],
  "startDate": "2026-10-01",
  "status": "active",
  "notes": "Class 10 Math & Physics"
}
```
*Weekday Mapping: `0` = Sunday, `1` = Monday, `2` = Tuesday, `3` = Wednesday, `4` = Thursday, `5` = Friday, `6` = Saturday.*

---

### 2. Class APIs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/classes` | Get classes (supports `?month=10&year=2026&studentId=...&status=...`) |
| `GET` | `/api/classes/:id` | Get single class session details |
| `POST` | `/api/classes` | Create custom / extra class session |
| `PUT` | `/api/classes/:id` | Update class date, time, or notes |
| `PATCH` | `/api/classes/:id/complete` | Mark class as completed, record timestamp & trigger notification check |
| `PATCH` | `/api/classes/:id/cancel` | Mark class as cancelled |
| `DELETE` | `/api/classes/:id` | Remove a class record |

---

### 3. Dashboard APIs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Get 7 summary metrics, today's classes, monthly progress & recent activity |
| `GET` | `/api/dashboard/monthly-progress` | Get student-wise monthly progress |
| `GET` | `/api/dashboard/upcoming-classes` | Get upcoming scheduled classes in chronological order |

---

### 4. Tuition Payment APIs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/payments` | Get payments with aggregated totals (supports `?month=...&year=...&status=...`) |
| `POST` | `/api/payments` | Record or update a student tuition payment |
| `GET` | `/api/payments/student/:studentId` | Get full payment history for a specific student |
| `PATCH` | `/api/payments/:id` | Update an existing payment record |

#### Sample Record Payment Payload (`POST /api/payments`):
```json
{
  "studentId": "6add18794e0c2b0853e089af",
  "month": 10,
  "year": 2026,
  "monthlyFee": 3000,
  "paidAmount": 2000,
  "paymentDate": "2026-10-15",
  "notes": "Partial payment via bKash"
}
```

---

### 5. Notification APIs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications` | Get notifications (supports `?unreadOnly=true`) |
| `PATCH` | `/api/notifications/:id/read` | Mark notification as read |
| `PATCH` | `/api/notifications/read-all` | Mark all notifications as read |
| `POST` | `/api/notifications/check` | Trigger on-demand monthly completion quota check |
| `DELETE` | `/api/notifications/:id` | Delete notification |

---

### 6. Monthly Summary Reports APIs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/monthly-summary?month=10&year=2026` | Get aggregated teaching & billing summary for all students |
| `GET` | `/api/monthly-summary/student/:studentId?month=10&year=2026` | Get monthly report for a specific student |

---

## 🗄️ MongoDB Database Design & Collections

Connected to **MongoDB Atlas** (`TuitionTrack` database):

1. **`students`**
   - Fields: `name`, `phone`, `address`, `monthlyFee`, `weeklyClasses`, `classDays`, `startDate`, `notes`, `status`, `createdAt`, `updatedAt`
   - Indexes: `{ status: 1 }`, `{ name: 1 }`

2. **`classes`**
   - Fields: `studentId`, `date` (`YYYY-MM-DD`), `status` (`'scheduled'` / `'completed'` / `'cancelled'`), `scheduledAt`, `completedAt`, `notes`, `createdAt`, `updatedAt`
   - Unique Index: `{ studentId: 1, date: 1 }` (Prevents duplicate classes for same student on same date)
   - Indexes: `{ date: 1 }`, `{ status: 1 }`

3. **`payments`**
   - Fields: `studentId`, `month`, `year`, `monthlyFee`, `paidAmount`, `paymentDate`, `paymentStatus` (`'paid'` / `'partial'` / `'unpaid'`), `notes`, `createdAt`, `updatedAt`
   - Index: `{ studentId: 1, month: 1, year: 1 }`

4. **`notifications`**
   - Fields: `studentId`, `studentName`, `month`, `year`, `title`, `message`, `completedClasses`, `expectedClasses`, `isRead`, `createdAt`
   - Unique Index: `{ studentId: 1, month: 1, year: 1 }` (Prevents duplicate milestone notifications)
   - Index: `{ isRead: 1 }`, `{ createdAt: -1 }`

---

## 🎨 Theme & User Interface

- **Theme**: Professional SaaS Dark Navy (`#0F172A`) and Royal Blue (`#2563EB`) design with Slate neutral tones (`#F8FAFC`).
- **Responsive Navigation**: Persistent desktop sidebar with quick collapsible drawer on mobile and tablet screens.
- **Interactive Feedback**: Instant toast notifications, loading indicators, and graceful empty states across all screens.
