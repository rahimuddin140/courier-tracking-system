# 📦 Courier & Parcel Delivery Tracking System — Full Project Prompt

> **Domain:** Logistics  
> **Stack:** Node.js + Express.js | EJS (SSR) | MongoDB Atlas  
> **Audience:** College project / Full-stack web development course

---

## 1. Project Overview

Build a **production-style Courier & Parcel Delivery Tracking System** where:

- **Customers** can book parcels by filling in sender/receiver details, pickup & drop addresses, weight, and parcel type — then track their parcel in real-time using a unique Tracking ID.
- **Delivery Agents** can view all parcels assigned to them, and update each parcel's status through a defined lifecycle (Booked → Picked Up → In Transit → Out for Delivery → Delivered / Failed).
- **Admins** can manage the entire system — assign parcels to agents, manage agent accounts, define delivery zones, and view an analytics dashboard.

Every status change must be recorded in a **status history log with a timestamp**, giving full auditability of a parcel's journey.

---

## 2. Tech Stack (Mandatory)

| Layer        | Technology                        |
| ------------ | --------------------------------- |
| **Frontend** | EJS templates (Server-Side Rendering) |
| **Backend**  | Node.js + Express.js              |
| **Database** | MongoDB Atlas (cloud-hosted, mandatory) |
| **ODM**      | Mongoose                          |
| **Auth**     | express-session + bcryptjs (password hashing) |
| **Styling**  | Bootstrap 5 (or Tailwind CSS via CDN) |
| **Icons**    | Bootstrap Icons or Font Awesome   |
| **Env Vars** | dotenv                            |

---

## 3. Users & Roles

The system has **three roles**, each with distinct permissions:

### 3.1 Customer
- Register & log in.
- Book a new parcel (fill in all required details).
- Receive a unique **Tracking ID** upon booking.
- Track any parcel by entering its Tracking ID (public tracking page — no login required for tracking).
- View a personal dashboard listing all their booked parcels and current statuses.
- Cancel a parcel **only if** status is still "Booked" (not yet picked up).

### 3.2 Delivery Agent
- Log in (accounts created by Admin only — no self-registration).
- View a list of all parcels assigned to them.
- Filter assigned parcels by status.
- Update parcel status through the lifecycle. Each update must:
  - Record the new status.
  - Record a timestamp (`Date.now()`).
  - Optionally record agent remarks (e.g., "Customer not available", "Address incorrect").
- View their own delivery statistics (total assigned, delivered, failed, in-transit).

### 3.3 Admin
- Log in (a single admin account can be seeded in the database).
- **Parcel Management:**
  - View all parcels in the system.
  - Filter/search parcels by status, tracking ID, date range, or agent.
  - Assign any unassigned parcel to a delivery agent.
  - Reassign a parcel to a different agent.
- **Agent Management:**
  - Create new agent accounts (name, email, phone, password, assigned zone).
  - Edit or deactivate agent accounts.
  - View agent-wise workload.
- **Zone Management:**
  - Create and manage delivery zones (zone name, list of pincodes covered).
  - Zones are used for agent assignment and delivery charge estimation.
- **Dashboard / Analytics:**
  - Total parcels booked (all time, today, this week).
  - Parcels by status: Booked, Picked Up, In Transit, Out for Delivery, Delivered, Failed.
  - Agent-wise load: how many parcels each agent currently has in each status.
  - Charts/visual stats (use Chart.js or simple EJS-rendered stat cards).

---

## 4. Data Models (Mongoose Schemas)

Design **at least** the following collections. Field names below are suggestions — adjust as needed, but capture the same data.

### 4.1 `User`
```
{
  name:          String, required
  email:         String, required, unique
  password:      String, required (hashed with bcryptjs)
  phone:         String, required
  role:          String, enum: ['customer', 'agent', 'admin'], default: 'customer'
  zone:          ObjectId (ref: Zone) — only for agents
  isActive:      Boolean, default: true
  createdAt:     Date, default: Date.now
}
```

### 4.2 `Parcel`
```
{
  trackingId:       String, required, unique (auto-generated, e.g., "PKG-20260921-XXXX")
  customer:         ObjectId, ref: 'User', required

  senderName:       String, required
  senderPhone:      String, required
  senderAddress:    String, required
  senderPincode:    String, required

  receiverName:     String, required
  receiverPhone:    String, required
  receiverAddress:  String, required
  receiverPincode:  String, required

  weight:           Number, required (in kg)
  parcelType:       String, enum: ['Document', 'Small Box', 'Medium Box', 'Large Box', 'Fragile', 'Other']
  description:      String

  currentStatus:    String, enum: ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed', 'Cancelled'], default: 'Booked'

  assignedAgent:    ObjectId, ref: 'User', default: null
  deliveryCharge:   Number, default: 0

  statusHistory: [
    {
      status:     String, required
      timestamp:  Date, default: Date.now
      updatedBy:  ObjectId, ref: 'User'
      remarks:    String
    }
  ]

  bookedAt:       Date, default: Date.now
  deliveredAt:    Date
}
```

### 4.3 `Zone`
```
{
  zoneName:    String, required, unique (e.g., "North Zone", "South Zone")
  pincodes:    [String]  — list of pincodes in this zone
  baseFee:     Number, default: 50  — base delivery charge for this zone
  perKgRate:   Number, default: 20  — per-kg charge for this zone
  createdAt:   Date, default: Date.now
}
```

---

## 5. Core Features — Detailed Breakdown

### 5.1 Authentication & Authorization

1. **Registration page** (`/register`) — only for customers. Fields: name, email, phone, password, confirm password.
2. **Login page** (`/login`) — for all roles. After login, redirect based on role:
   - Customer → `/customer/dashboard`
   - Agent → `/agent/dashboard`
   - Admin → `/admin/dashboard`
3. **Session-based auth** using `express-session` with a MongoDB session store (`connect-mongo`).
4. **Middleware:**
   - `isAuthenticated` — checks if session exists.
   - `authorizeRole('admin')`, `authorizeRole('agent')`, `authorizeRole('customer')` — checks role.
5. **Logout** (`/logout`) — destroys session, redirects to login.
6. **Password hashing** with `bcryptjs` — hash on registration, compare on login.

### 5.2 Parcel Booking (Customer)

1. Customer clicks "Book a Parcel" from their dashboard.
2. **Booking form** collects:
   - Sender: name, phone, full address, pincode.
   - Receiver: name, phone, full address, pincode.
   - Parcel: weight (kg), type (dropdown), description (optional).
3. On submit:
   - Generate a unique **Tracking ID** (format: `PKG-YYYYMMDD-XXXX` where XXXX is a random 4-char alphanumeric string).
   - Calculate delivery charge (see Stretch Goal §6).
   - Create a `Parcel` document with `currentStatus: 'Booked'`.
   - Push the first entry into `statusHistory`: `{ status: 'Booked', timestamp: now, updatedBy: customerId }`.
   - Save to MongoDB Atlas.
4. Show a **booking confirmation page** with the Tracking ID prominently displayed, along with a "Copy Tracking ID" button.

### 5.3 Parcel Tracking (Public)

1. A **public tracking page** at `/track` — accessible without login.
2. User enters a Tracking ID in a search box.
3. System fetches the parcel and displays:
   - Tracking ID, sender city, receiver city, parcel type, weight.
   - **Current status** (highlighted, with a progress bar or stepper UI showing all stages).
   - **Full status history** table: Status | Date & Time | Remarks — sorted newest first.
4. If tracking ID not found, show a user-friendly error message.

### 5.4 Admin — Parcel Assignment

1. Admin views a list of all parcels with status "Booked" (unassigned).
2. Admin clicks "Assign Agent" on a parcel → modal or dropdown showing available agents (optionally filtered by zone matching the receiver's pincode).
3. On assignment:
   - Set `assignedAgent` on the parcel.
   - Optionally auto-update status to "Picked Up" or leave as "Booked" for the agent to update.
4. Admin can also reassign parcels if an agent is overloaded or unavailable.

### 5.5 Agent — Status Updates

1. Agent logs in and sees their **assigned parcels list**, grouped or filterable by status.
2. Agent clicks on a parcel → detail view showing all parcel info + current status.
3. Agent clicks "Update Status" → selects the **next valid status** from a dropdown:
   - Booked → Picked Up
   - Picked Up → In Transit
   - In Transit → Out for Delivery
   - Out for Delivery → Delivered / Failed
4. Agent can add optional **remarks** (text field).
5. On submit:
   - Update `currentStatus` on the parcel.
   - Push a new entry to `statusHistory` with status, timestamp, agent ID, and remarks.
   - If status is "Delivered", set `deliveredAt = Date.now()`.
6. **Validation:** Status transitions must follow the defined order — agents cannot skip steps or go backwards.

### 5.6 Status History Log

Every parcel maintains a `statusHistory` array. Each entry contains:
- `status` — the status at that point.
- `timestamp` — exact date & time (`Date.now()`).
- `updatedBy` — reference to the User who made the change (customer, agent, or admin).
- `remarks` — optional text note.

This array is **append-only** — entries are never deleted or edited.

### 5.7 Dashboard

#### Customer Dashboard (`/customer/dashboard`)
- Welcome message with customer name.
- Quick stats: Total Parcels, In Transit, Delivered, Failed.
- Table of all their booked parcels: Tracking ID | Receiver | Status | Booked Date | Action (Track / Cancel).

#### Agent Dashboard (`/agent/dashboard`)
- Welcome message.
- Stats: Assigned Today, In Transit, Delivered, Failed.
- Table of assigned parcels: Tracking ID | Receiver Address | Status | Action (Update Status).
- Filter/tab by status.

#### Admin Dashboard (`/admin/dashboard`)
- **Stat cards:** Total Parcels, Booked (Unassigned), In Transit, Out for Delivery, Delivered, Failed.
- **Agent-wise workload table:** Agent Name | Assigned | Picked Up | In Transit | Delivered | Failed.
- **Recent parcels table** (last 10–20 parcels with status and dates).
- Links to: Manage Agents, Manage Zones, View All Parcels.

---

## 6. Stretch Goal — Delivery Charge Estimation

Calculate a delivery charge when a customer books a parcel, based on:

```
deliveryCharge = zone.baseFee + (parcel.weight × zone.perKgRate)
```

**Logic:**
1. When booking, take the **receiver's pincode**.
2. Look up which `Zone` contains that pincode.
3. If found, calculate the charge using that zone's `baseFee` and `perKgRate`.
4. If pincode is not in any zone, use a default charge (e.g., baseFee=100, perKgRate=30).
5. Display the estimated charge on the booking confirmation page and store it in the `Parcel` document.

**Admin can configure zones:** Add zones, add pincodes to zones, set baseFee and perKgRate for each zone.

---

## 7. Routes Structure

```
GET   /                          → Landing page (public)
GET   /register                  → Registration form
POST  /register                  → Handle registration
GET   /login                     → Login form
POST  /login                     → Handle login
GET   /logout                    → Destroy session, redirect

GET   /track                     → Public tracking page
POST  /track                     → Fetch parcel by tracking ID, display result

--- Customer Routes (protected: isAuthenticated + role:customer) ---
GET   /customer/dashboard        → Customer dashboard
GET   /customer/book             → Booking form
POST  /customer/book             → Handle booking
GET   /customer/parcels          → List all customer's parcels
POST  /customer/cancel/:id       → Cancel a parcel (if status = Booked)

--- Agent Routes (protected: isAuthenticated + role:agent) ---
GET   /agent/dashboard           → Agent dashboard
GET   /agent/parcels             → List assigned parcels
GET   /agent/parcel/:id          → Parcel detail
POST  /agent/parcel/:id/update   → Update parcel status

--- Admin Routes (protected: isAuthenticated + role:admin) ---
GET   /admin/dashboard           → Admin dashboard
GET   /admin/parcels             → All parcels (with filters)
POST  /admin/parcel/:id/assign   → Assign parcel to agent
GET   /admin/agents              → List all agents
GET   /admin/agents/create       → Create agent form
POST  /admin/agents/create       → Handle agent creation
GET   /admin/agents/edit/:id     → Edit agent form
POST  /admin/agents/edit/:id     → Handle agent update
GET   /admin/zones               → List all zones
GET   /admin/zones/create        → Create zone form
POST  /admin/zones/create        → Handle zone creation
GET   /admin/zones/edit/:id      → Edit zone form
POST  /admin/zones/edit/:id      → Handle zone update
```

---

## 8. Folder Structure

```
courier-tracking-system/
├── config/
│   └── db.js                    # MongoDB Atlas connection via Mongoose
├── models/
│   ├── User.js
│   ├── Parcel.js
│   └── Zone.js
├── routes/
│   ├── authRoutes.js            # Register, login, logout
│   ├── trackRoutes.js           # Public tracking
│   ├── customerRoutes.js
│   ├── agentRoutes.js
│   └── adminRoutes.js
├── middlewares/
│   ├── isAuthenticated.js
│   └── authorizeRole.js
├── helpers/
│   ├── generateTrackingId.js    # Tracking ID generator utility
│   └── calculateCharge.js       # Delivery charge calculator
├── views/
│   ├── layouts/
│   │   └── main.ejs             # Common HTML shell (head, navbar, footer)
│   ├── partials/
│   │   ├── navbar.ejs           # Navbar (changes based on role)
│   │   ├── footer.ejs
│   │   ├── flash.ejs            # Flash message partial
│   │   └── statusBadge.ejs      # Colored badge for status
│   ├── auth/
│   │   ├── register.ejs
│   │   └── login.ejs
│   ├── track.ejs                # Public tracking page + results
│   ├── customer/
│   │   ├── dashboard.ejs
│   │   ├── bookParcel.ejs
│   │   └── myParcels.ejs
│   ├── agent/
│   │   ├── dashboard.ejs
│   │   ├── assignedParcels.ejs
│   │   └── parcelDetail.ejs
│   ├── admin/
│   │   ├── dashboard.ejs
│   │   ├── allParcels.ejs
│   │   ├── manageAgents.ejs
│   │   ├── createAgent.ejs
│   │   ├── editAgent.ejs
│   │   ├── manageZones.ejs
│   │   ├── createZone.ejs
│   │   └── editZone.ejs
│   ├── landing.ejs              # Public landing page
│   └── 404.ejs                  # Not found page
├── public/
│   ├── css/
│   │   └── style.css            # Custom styles
│   ├── js/
│   │   └── main.js              # Client-side JS (copy tracking ID, etc.)
│   └── images/
│       └── logo.png
├── seed/
│   └── seed.js                  # Seed script: create admin account + sample zones
├── .env                         # Environment variables (MONGO_URI, SESSION_SECRET, PORT)
├── .gitignore
├── app.js                       # Express app setup (middleware, routes, error handling)
├── package.json
└── README.md
```

---

## 9. MongoDB Atlas Setup

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free M0 cluster.
2. Create a database user with read/write access.
3. Whitelist your IP (or use `0.0.0.0/0` for development).
4. Get the connection string and place it in `.env`:
   ```
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/courierDB?retryWrites=true&w=majority
   SESSION_SECRET=your-super-secret-key
   PORT=3000
   ```
5. In `config/db.js`:
   ```javascript
   const mongoose = require('mongoose');
   const connectDB = async () => {
     try {
       await mongoose.connect(process.env.MONGO_URI);
       console.log('✅ Connected to MongoDB Atlas');
     } catch (err) {
       console.error('❌ MongoDB connection failed:', err.message);
       process.exit(1);
     }
   };
   module.exports = connectDB;
   ```

---

## 10. Key npm Packages

```json
{
  "dependencies": {
    "express": "^4.18.x",
    "ejs": "^3.1.x",
    "express-ejs-layouts": "^2.5.x",
    "mongoose": "^7.x or ^8.x",
    "express-session": "^1.17.x",
    "connect-mongo": "^5.x",
    "bcryptjs": "^2.4.x",
    "dotenv": "^16.x",
    "connect-flash": "^0.1.x",
    "method-override": "^3.0.x"
  },
  "devDependencies": {
    "nodemon": "^3.x"
  }
}
```

---

## 11. Seed Script (`seed/seed.js`)

Create a seed script that:
1. Connects to MongoDB Atlas.
2. Drops existing data (for fresh start during development).
3. Creates one **Admin** account:
   - Email: `admin@courier.com` | Password: `admin123` (hashed).
4. Creates 2–3 **sample Zones** with pincodes, baseFee, and perKgRate.
5. Optionally creates 2–3 **sample Agents** assigned to zones.
6. Optionally creates 3–5 **sample Parcels** in various statuses with status history.
7. Logs all created data to console and disconnects.

Run with: `node seed/seed.js`

---

## 12. UI/UX Guidelines

- **Consistent layout:** Use `express-ejs-layouts` with a shared `main.ejs` layout (HTML head, navbar, main content area, footer).
- **Responsive:** Use Bootstrap 5 grid. The app should work on mobile screens.
- **Navbar:** Show different links based on user role (use `res.locals` to pass user data to views).
- **Flash messages:** Use `connect-flash` for success/error messages (e.g., "Parcel booked successfully!", "Invalid credentials").
- **Status badges:** Color-coded badges for each status:
  - Booked → `bg-secondary`
  - Picked Up → `bg-info`
  - In Transit → `bg-primary`
  - Out for Delivery → `bg-warning`
  - Delivered → `bg-success`
  - Failed → `bg-danger`
  - Cancelled → `bg-dark`
- **Tracking page:** A clean stepper/progress bar showing all 5 stages, with the current stage highlighted.
- **Tables:** Sortable, paginated (or at minimum, filtered) parcel lists.
- **Forms:** Client-side validation (required fields, valid email, phone format, weight > 0).

---

## 13. Implementation Order (Step-by-Step)

Follow this order to build incrementally and test as you go:

| Step | Task | Test |
|------|------|------|
| 1 | Initialize project, install packages, set up `app.js`, connect to MongoDB Atlas | Server starts, "Connected to MongoDB Atlas" logs |
| 2 | Create `User` model + auth routes (register, login, logout) + EJS views | Can register as customer, login, see dashboard, logout |
| 3 | Add session-based auth middleware (`isAuthenticated`, `authorizeRole`) | Protected routes redirect to login if not authenticated |
| 4 | Create the seed script — seed admin, zones, agents | Run seed, verify data in MongoDB Atlas UI |
| 5 | Build Customer booking flow: `Parcel` model, booking form, tracking ID generation | Customer can book a parcel, sees confirmation with tracking ID |
| 6 | Build public tracking page (`/track`) | Enter tracking ID → see parcel status + history |
| 7 | Build Admin parcel management: view all parcels, assign to agent | Admin can see all parcels, assign agent from dropdown |
| 8 | Build Agent flow: view assigned parcels, update status with history | Agent updates status → status history grows, currentStatus changes |
| 9 | Build Admin agent management: create, edit, deactivate agents | Admin can CRUD agents |
| 10 | Build Admin zone management: create, edit zones | Admin can CRUD zones |
| 11 | Build all three dashboards with stats | Each role sees correct stats |
| 12 | Add delivery charge estimation (stretch goal) | Booking calculates charge based on zone + weight |
| 13 | Polish UI: flash messages, status badges, responsive design, error pages | Clean UX across all flows |
| 14 | Write README.md with setup instructions | Another developer can clone and run |

---

## 14. Validation & Error Handling

- **Server-side validation** on all form submissions (check required fields, valid email format, weight > 0, etc.). Use simple `if` checks or a library like `express-validator`.
- **Duplicate email check** on registration.
- **404 page** for unknown routes.
- **Error middleware** in Express for unhandled errors → render a generic error page.
- **Tracking ID not found** → show "No parcel found with this tracking ID" message with a retry form.
- **Unauthorized access** → redirect to login with flash message.

---

## 15. Security Considerations

- Store passwords **hashed** (bcryptjs, saltRounds = 10).
- Use **environment variables** for MONGO_URI, SESSION_SECRET — never commit `.env`.
- Set `httpOnly: true` and `secure: true` (in production) on session cookies.
- Sanitize user inputs to prevent **NoSQL injection** (avoid passing raw `req.body` to queries directly).
- Add `.env` and `node_modules/` to `.gitignore`.

---

## 16. README.md Template

```markdown
# 📦 Courier & Parcel Delivery Tracking System

A full-stack web application for booking, managing, and tracking courier parcels.

## Tech Stack
- Node.js + Express.js (Backend)
- EJS (Server-Side Rendering)
- MongoDB Atlas (Database)
- Bootstrap 5 (Styling)

## Features
- Role-based authentication (Customer, Agent, Admin)
- Parcel booking with unique tracking ID
- Real-time status tracking with history log
- Admin dashboard with analytics
- Agent parcel management and status updates
- Delivery charge estimation based on weight and zone

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd courier-tracking-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root:
   ```
   MONGO_URI=mongodb+srv://<your-connection-string>
   SESSION_SECRET=your-secret-key
   PORT=3000
   ```

4. Seed the database:
   ```bash
   node seed/seed.js
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000` in your browser.

## Default Admin Login
- Email: admin@courier.com
- Password: admin123
```

---

## 17. Deliverables Checklist

- [ ] Project runs with `npm start` or `npm run dev`
- [ ] Connected to **MongoDB Atlas** (not local MongoDB)
- [ ] Customer can register, login, and book a parcel
- [ ] Unique tracking ID generated for each parcel
- [ ] Public tracking page works without login
- [ ] Admin can assign parcels to agents
- [ ] Admin can create/manage agents and zones
- [ ] Agent can update parcel status through the full lifecycle
- [ ] Every status change is logged in `statusHistory` with a timestamp
- [ ] Three role-based dashboards with stats
- [ ] Flash messages for user feedback
- [ ] Responsive UI with Bootstrap
- [ ] Seed script creates admin + sample data
- [ ] `.env` used for secrets (not hardcoded)
- [ ] README.md with setup instructions
- [ ] (Stretch) Delivery charge calculated from weight + zone
