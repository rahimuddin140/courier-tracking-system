# 📦 Courier & Parcel Delivery Tracking System

A full-stack enterprise logistics web application built with **Node.js, Express.js, EJS (Server-Side Rendering)**, and **MongoDB Atlas**.

---

## 🌟 Key Features

### 👤 Role-Based Authentication & Permissions
- **Customer**:
  - Secure registration & login with bcrypt password hashing.
  - Parcel booking with sender/receiver details, pickup & drop addresses, weight, and parcel type.
  - Automatic delivery charge estimation based on destination pincode and parcel weight.
  - Instant unique Tracking ID generation (`PKG-YYYYMMDD-XXXX`).
  - Booking confirmation with one-click clipboard copy.
  - View personal bookings and cancel bookings if still in "Booked" status.
- **Delivery Agent**:
  - Secure login (accounts managed exclusively by Admin).
  - View assigned parcels filterable by status.
  - Enforced lifecycle state machine:  
    `Booked` ➔ `Picked Up` ➔ `In Transit` ➔ `Out for Delivery` ➔ `Delivered` / `Failed`.
  - Add delivery notes & remarks on every status update.
- **Logistics Administrator**:
  - Centralized dashboard with real-time stats (Total parcels, In-transit, Delivered, Failed).
  - Agent-wise workload table showing live load, delivered parcels, and active assignments.
  - Assign or reassign unassigned parcels to agents.
  - Full CRUD operations for Delivery Agents (with zone mapping).
  - Full CRUD operations for Delivery Zones (custom pincodes, base fees, and per-kg rates).

### 🔍 Public Real-Time Tracking
- Public tracking page (`/track`) accessible without login.
- Interactive 5-stage visual progress stepper.
- **Immutable Status History Log**: Complete audit trail recording every state transition with exact timestamps (`Date.now()`), updating agent/admin name, and remarks.

### 💰 Dynamic Delivery Charge Engine (Stretch Goal)
- Formula: `Delivery Charge = Zone Base Fee + (Weight × Zone Rate/kg)`
- Automatic zone detection via receiver pincode with standard national fallback rate.
- Live client-side calculation preview during parcel booking.

---

## 🛠️ Tech Stack

- **Backend**: Node.js & Express.js
- **Frontend**: EJS (Server-Side Rendering) with `express-ejs-layouts`
- **Database**: MongoDB Atlas via Mongoose ODM
- **Session Management**: `express-session` with `connect-mongo` session store
- **Styling**: Bootstrap 5, Bootstrap Icons, Custom CSS
- **Security**: `bcryptjs` password hashing, input sanitization, environment configuration

---

## 📂 Project Architecture

```
courier-tracking-system/
├── config/
│   └── db.js                    # MongoDB Atlas connection (with local fallback)
├── models/
│   ├── User.js                  # Customer, Agent, Admin schema & password hashing
│   ├── Parcel.js                # Parcel booking & timestamped statusHistory log
│   └── Zone.js                  # Regional zones, pincodes, baseFee & perKgRate
├── routes/
│   ├── authRoutes.js            # /register, /login, /logout
│   ├── trackRoutes.js           # /track (Public tracking)
│   ├── customerRoutes.js        # /customer/dashboard, /book, /parcels, /cancel
│   ├── agentRoutes.js           # /agent/dashboard, /parcels, /parcel/:id/update
│   └── adminRoutes.js           # /admin/dashboard, /parcels, /agents, /zones
├── middlewares/
│   ├── isAuthenticated.js       # Session presence verification
│   └── authorizeRole.js         # Role-based access control (admin/agent/customer)
├── helpers/
│   ├── generateTrackingId.js    # Unique PKG-YYYYMMDD-XXXX generator
│   └── calculateCharge.js       # Dynamic zone delivery fee calculator
├── views/
│   ├── layouts/
│   │   └── main.ejs             # Master layout with Bootstrap & navbar
│   ├── partials/
│   │   ├── navbar.ejs           # Dynamic role-based navigation bar
│   │   ├── footer.ejs           # Footer partial
│   │   ├── flash.ejs            # Alert notifications partial
│   │   └── statusBadge.ejs      # Color-coded status badge partial
│   ├── auth/
│   │   ├── register.ejs         # Customer registration
│   │   └── login.ejs            # Role-based login (with demo quick-fill)
│   ├── track.ejs                # Public tracking page with progress stepper
│   ├── customer/
│   │   ├── dashboard.ejs        # Customer dashboard & quick stats
│   │   ├── bookParcel.ejs       # Booking form with live rate preview
│   │   ├── bookingSuccess.ejs   # Booking confirmation & tracking code
│   │   └── myParcels.ejs        # Booked parcels with status filter tabs
│   ├── agent/
│   │   ├── dashboard.ejs        # Field agent dashboard & workload
│   │   ├── assignedParcels.ejs  # Assigned deliveries
│   │   └── parcelDetail.ejs     # Status update form & history trail
│   ├── admin/
│   │   ├── dashboard.ejs        # Admin command center & agent load table
│   │   ├── allParcels.ejs       # All parcels with filter & agent assign modal
│   │   ├── manageAgents.ejs     # Delivery agent fleet list
│   │   ├── createAgent.ejs      # Add agent form
│   │   ├── editAgent.ejs        # Edit agent form
│   │   ├── manageZones.ejs      # Delivery zones list
│   │   ├── createZone.ejs       # Add zone form
│   │   └── editZone.ejs         # Edit zone form
│   ├── landing.ejs              # Public homepage
│   ├── 404.ejs                  # 404 Not found page
│   └── 500.ejs                  # Server error page
├── public/
│   ├── css/style.css            # Custom layout, card styles, and stepper
│   └── js/main.js               # Copy to clipboard & live rate calculation
├── seed/
│   └── seed.js                  # Database seed script for test accounts & data
├── .env.example                 # Environment configuration template
├── .env                         # Environment variables (ignored in git)
├── app.js                       # Express app bootstrap & middleware
└── package.json
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on v20 and v24)
- **MongoDB Atlas** account (or local development mode)

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and set your MongoDB Atlas connection string:
```ini
PORT=3000
SESSION_SECRET=your-production-secret-key
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/courierDB?retryWrites=true&w=majority
```
*(Note: If `MONGO_URI` is left blank during local development, the system starts an automatic local fallback database so you can preview and test immediately.)*

### 4. Seed the Database
Populate test delivery zones, administrative accounts, field agents, and sample parcels with full tracking logs:
```bash
npm run seed
```

### 5. Start the Server
```bash
npm start
# Or for development with auto-restart:
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🔑 Default Login Credentials (from Seed)

| Role | Email | Password | Purpose |
|---|---|---|---|
| **Admin** | `admin@courier.com` | `admin123` | System management, agent workload, zones |
| **Agent** | `rajesh@courier.com` | `agent123` | Delhi-NCR zone field agent |
| **Agent** | `priya@courier.com` | `agent123` | Mumbai-Pune zone field agent |
| **Agent** | `arun@courier.com` | `agent123` | Bengaluru zone field agent |
| **Customer** | `customer@courier.com` | `customer123` | Customer with sample bookings |
| **Customer** | `sneha@example.com` | `customer123` | Customer with active shipments |

---

## 📦 Sample Tracking IDs for Testing

You can paste these directly into `/track` or the homepage:

| Tracking ID | Current Status | Description |
|---|---|---|
| `PKG-20260920-A101` | **In Transit** | Legal contracts dispatched via express hub |
| `PKG-20260920-B202` | **Delivered** | Electronic gadget delivered and signed |
| `PKG-20260921-C303` | **Out for Delivery** | Fragile ceramic set out on delivery route |
| `PKG-20260921-D404` | **Booked** | Festival gift hamper awaiting agent assignment |
| `PKG-20260921-E505` | **Failed** | Transcripts with failed customer contact attempt |

---

## 🛡️ Security & Best Practices

- **Bcrypt Hashing**: 10 salt rounds used for all user and agent passwords.
- **Session Protection**: HttpOnly cookies with 7-day expiration stored persistently in MongoDB.
- **Role Isolation**: Express middleware blocks customers from agent/admin routes and agents from admin functions.
- **State Transition Guard**: Agents are strictly restricted to sequential parcel lifecycle movements.
