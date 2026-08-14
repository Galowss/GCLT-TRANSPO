# GCLT Transport & Trucking Services
# Administrator Operations Manual

> This manual is strictly for authorized **GCLT system administrators**. It covers all back-office operations including booking management, quotation workflows, fleet control, appointment scheduling, customer communications, and reporting.

---

## Table of Contents

1. [Accessing the Admin Portal](#1-accessing-the-admin-portal)
2. [Admin Dashboard Overview](#2-admin-dashboard-overview)
3. [Booking Management](#3-booking-management)
4. [Quotation Workflow (Setting Prices)](#4-quotation-workflow-setting-prices)
5. [Booking Status Lifecycle](#5-booking-status-lifecycle)
6. [Payment Verification & Receipt Management](#6-payment-verification--receipt-management)
7. [Sending Notifications to Users](#7-sending-notifications-to-users)
8. [Exporting Bookings to CSV](#8-exporting-bookings-to-csv)
9. [Fleet Management (Active Trucks)](#9-fleet-management-active-trucks)
10. [Trucks for Sale Inventory](#10-trucks-for-sale-inventory)
11. [Viewing Appointment Management](#11-viewing-appointment-management)
12. [Customer Management](#12-customer-management)
13. [Notifications & System Alerts](#13-notifications--system-alerts)
14. [Admin Settings](#14-admin-settings)
15. [Booking Status Reference & Troubleshooting](#15-booking-status-reference--troubleshooting)

---

## 1. Accessing the Admin Portal

Only accounts designated as **admin** in the Firebase Authentication system can access the admin panel.

1. Log in with your admin credentials at the GCLT website.
2. After logging in, click **"Admin Panel"** in the navigation or go directly to `/admin`.
3. If you see "Access Denied", your account has not been granted admin privileges. Contact the system owner to have your user role updated in Firestore.

> **Security Note:** Admin accounts should use strong passwords. Do not share credentials. All admin actions are logged with timestamps and user IDs in Firestore.

---

## 2. Admin Dashboard Overview

The Admin Dashboard is your command center. Key metrics are shown at a glance:

| Card | What It Shows |
|---|---|
| **Active Bookings** | Count of ongoing transport jobs in progress |
| **Pending Quotes** | Bookings awaiting price calculation from your team |
| **Fleet Available** | Number of trucks currently free and assignable |
| **Revenue (Month)** | Total confirmed payments for the current month |

### Admin Sidebar Navigation

| Item | Function |
|---|---|
| **Dashboard** | High-level metrics and recent activity |
| **Bookings** | Manage all transport booking requests |
| **Fleet** | Manage active operational truck inventory |
| **Trucks for Sale** | Manage vehicle sales listings |
| **Appointments** | Review truck viewing appointment requests |
| **Customers** | Browse registered customer profiles |
| **Transactions** | View payment and financial records |
| **Notifications** | Manage system and user notifications |
| **Settings** | System and account configuration |

---

## 3. Booking Management

This is the most critical section of the admin panel. All transport quote requests, active deliveries, and completed jobs flow through here.

### Opening Booking Management

1. Click **"Bookings"** in the admin sidebar.
2. You will see a full table of all bookings across all customers.

### Reading the Bookings Table

Each row in the table represents one customer booking:

| Column | Description |
|---|---|
| **ID** | Last 6 characters of the unique booking ID |
| **Customer** | Customer display name or user ID |
| **Vehicle Type** | The truck type requested (e.g., "10-Wheeler Wing Van") |
| **Route** | Pickup address → Drop-off address |
| **Date & Time** | Preferred transport date and time slot |
| **Amount** | Quoted price in PHP (shows "—" if not yet quoted) |
| **Status** | Current booking lifecycle status |
| **Actions** | Opens booking details panel |

### Searching & Filtering

- **Search Bar:** Type any value to filter — booking ID, customer name, pickup location, delivery location, date (e.g., `2026-05-07`), or quoted amount.
- **Status Filter Dropdown:** Filter by a specific status to focus on actionable items (e.g., show only `Quote Requested` bookings).
- **Result Count:** The counter to the right shows how many bookings match your current filter vs. the total.

### Opening a Booking's Details

Click anywhere on a booking row to open the **Booking Details Sidebar** on the right side of the screen.

The sidebar shows:
- **Customer Information:** Name, email, user ID
- **Route Information:** Full pickup and delivery addresses, special notes
- **Vehicle & Cargo:** Truck type, date, time slot, cargo weight, dimensions, route type (Old Road or Expressway), payment method
- **Quote Controls** (for `Quote Requested` status)
- **Status Action Buttons**
- **Cash Receipt Section** (for COD payments)
- **Notification Button**

To close the sidebar, click the **✕** button or click anywhere outside the panel.

---

## 4. Quotation Workflow (Setting Prices)

When a customer submits a booking, it arrives as **"Quote Requested"**. Your job is to review the cargo details and calculate a fair price.

### Step-by-Step: Setting a Quote

1. In the Bookings table, filter by **"Quote Requested"** using the status dropdown.
2. Click a booking row to open its details panel.
3. Review the following before setting a price:
   - **Pickup and Delivery locations** (use to calculate route distance and tolls)
   - **Cargo Weight** (in KG)
   - **Cargo Dimensions** (L × W × H in meters)
   - **Auto-Assigned Route** (Old Road vs. Expressway)
   - **Estimated Distance** (if shown — calculated from the Leaflet routing engine)
   - **Special Instructions** (gate passes, fragile cargo, extra handling)
4. In the yellow **"Set Quote for Customer"** panel, enter the price in PHP.
5. Click **"Send Quote"**.

### What Happens When You Send a Quote

- The booking status updates to **"Quoted"**.
- The customer receives a **push notification** on their dashboard: *"Your quote is ready — PHP X,XXX"*.
- An **email invoice** is automatically sent to the customer's email via Mailjet, containing the booking details and the quoted amount.
- The quoted amount is stored in the booking record and visible to the customer in **My Bookings**.

> **Tip:** If you need more information before quoting (e.g., additional cargo photos or gate pass confirmation), use the **"Send Notification to User"** button to request clarification first.

---

## 5. Booking Status Lifecycle

As the admin, you manually advance bookings through the following lifecycle:

```
Quote Requested → Quoted → Pending Payment → Confirmed → In Transit → Completed
```

### Status Progression Controls

The action buttons in the details sidebar change dynamically based on the current status:

| Current Status | Available Actions |
|---|---|
| **Quote Requested** | Set Quote → (transitions to Quoted) |
| **Quoted** | (Customer accepts and pays; auto-transitions) |
| **Pending Payment** | Wait for payment; or Cancel |
| **Confirmed** | Mark as "In Transit" • Cancel |
| **In Transit** | Mark as "Completed" • Cancel |
| **Completed** | No further actions available |
| **Any active status** | Cancel Booking |

### Manually Cancelling a Booking

1. Open the booking details panel.
2. Click the red **"Cancel"** button.
3. The status changes to **"Cancelled"** and the customer receives a notification.

> **Note:** Bookings with status `Completed`, `Cancelled`, or `Declined` cannot be changed again.

---

## 6. Payment Verification & Receipt Management

### Stripe Payments (Automatic)

When a customer pays online via Stripe, the system automatically:
1. Verifies the payment through Stripe's webhook.
2. Updates the booking status to **"Confirmed"**.
3. Sends a receipt email to the customer.

No manual action is required from the admin for Stripe payments.

### Cash on Delivery (COD) — Manual Review

For COD bookings, you must manually verify payment:

1. Open the booking in the details panel.
2. The **"Proof of Payment / Receipt"** section will appear for COD bookings in `Confirmed`, `In Transit`, or `Completed` status.
3. Once the customer or driver uploads a cash receipt photo, it appears in this section.
4. Review the receipt image.
5. If the payment is verified, advance the status to **"Completed"** using the status buttons.

#### If the Receipt Image Needs to Be Replaced

1. Click **"Replace"** under the existing receipt image.
2. Upload a corrected version.
3. The new image replaces the old one in Firestore.

#### If No Receipt Has Been Uploaded Yet

The section shows a dashed upload area with: *"Click to attach receipt or proof of payment."*
- An admin can upload the receipt directly from this view (useful if the driver sends the photo separately).

---

## 7. Sending Notifications to Users

You can send a direct notification to any customer from within their booking details panel.

1. Open the booking details panel.
2. Scroll to the bottom of the panel.
3. Click **"Send Notification to User"**.

This sends a standardized update notification to the customer's dashboard, including:
- Booking ID reference
- Current booking status
- Quoted amount (if applicable)

> **Note:** Guest bookings (users who booked without creating an account) cannot receive notifications. The button will be disabled for these bookings.

---

## 8. Exporting Bookings to CSV

You can export booking data to a spreadsheet for reporting, billing, or accounting.

1. Apply any filters you need (by status, date, or search query).
2. Click the **"Export CSV"** button at the top right of the Bookings page.
3. A `.csv` file named `gclt-bookings-YYYY-MM-DD.csv` will download to your device.

### Exported Fields

The CSV file contains the following columns:

| Column | Description |
|---|---|
| ID | Full booking ID |
| User | Customer name |
| Vehicle Type | Truck type selected |
| Pickup | Full pickup address |
| Delivery | Full delivery address |
| Date | Preferred transport date |
| Time | Preferred time slot |
| Weight | Cargo weight in KG |
| Size | Cargo dimensions |
| Payment | Stripe or COD |
| Status | Current booking status |
| Quoted Amount | Price in PHP (if set) |

> The export only includes bookings matching your **current active filter**. To export all bookings, clear all filters before exporting.

---

## 9. Fleet Management (Active Trucks)

The **Fleet** section manages the trucks currently in GCLT's operational inventory — the vehicles available for cargo bookings.

### Viewing the Fleet

Click **"Fleet"** in the sidebar to see all registered operational trucks.

Each entry shows:
- Truck name and model
- Category (Small, Medium, Large, Specialized)
- Payload capacity
- Physical dimensions
- Current status (Available, In Maintenance, On Route)
- Per-km rate or base price

### Adding a New Truck

1. Click **"Add Truck"** or the **"+"** button.
2. Fill in the truck details:
   - **Name** (e.g., "10-Wheeler Wing Van - Unit 04")
   - **Category** — Small, Medium, Large, or Specialized
   - **Capacity** (e.g., "10 tons")
   - **Dimensions** (cargo bay size)
   - **Rate per KM** or fixed price
3. Upload a **truck photo** (compressed automatically by the system).
4. Click **"Save"**.

The truck immediately becomes visible to customers in the booking wizard under Step 2: Choose Vehicle.

### Updating Truck Availability

1. Click on a truck in the fleet list.
2. Change its status:
   - ✅ **Available** — Visible and selectable in the booking wizard.
   - 🔧 **In Maintenance** — Hidden from the customer booking wizard. Truck is being serviced.
   - 🚛 **On Route** — Truck is currently assigned to an active delivery.

> Trucks marked as **"In Maintenance"** or with `available: false` are automatically filtered out of the customer-facing booking options.

### Editing or Removing a Truck

- Click the truck entry and use the **Edit** button to update any field.
- Use the **Delete / Archive** button to remove a truck from the fleet. This does not delete historical booking records linked to that truck.

---

## 10. Trucks for Sale Inventory

The **Trucks for Sale** section manages the commercial vehicle sales catalog shown to the public on the GCLT website.

### Adding a New Sales Listing

1. Click **"Trucks for Sale"** in the sidebar.
2. Click **"Add Listing"** or **"+"**.
3. Fill in the sales specification form:

| Field | Description |
|---|---|
| **Name** | Full truck name and model (e.g., "Hino 500 Series Wing Van") |
| **Year** | Manufacture year |
| **Price** | Asking price in PHP |
| **Condition** | Brand New / Pre-Owned / Certified Refurbished |
| **Engine** | Engine type and displacement |
| **Mileage** | Odometer reading in kilometers |
| **Transmission** | Manual / Automatic + gear count |
| **Horsepower** | Engine power output |
| **GVW** | Gross Vehicle Weight in tons |
| **Location** | Physical location (e.g., "SBMA Yard" or "Olongapo Depot") |
| **Type** | Truck class (Heavy Duty, Dump Truck, Flatbed, Wing Van, etc.) |
| **Photos** | Upload multiple images of the vehicle |

4. Click **"Publish Listing"** to make it live on the website.

### Marking a Truck as Sold

1. Open the listing.
2. Click **"Mark as Sold"** (or toggle the availability switch).
3. The truck is immediately removed from the public catalog.
4. The record is retained in the database for financial tracking.

### Editing an Existing Listing

1. Click on the truck listing.
2. Update any field (price, condition, photos, etc.).
3. Click **"Save Changes"**.

---

## 11. Viewing Appointment Management

When customers schedule a physical truck viewing, those appointments appear here for admin review and coordination.

### Reviewing Appointments

1. Click **"Appointments"** in the admin sidebar.
2. Appointments are displayed in a list or calendar view with:
   - Customer name and contact number
   - Truck they want to view
   - Preferred date and time
   - Their current base location
   - Special requests or notes
   - Current status (Pending, Approved, Completed, Declined)

### Approving an Appointment

1. Click the appointment entry.
2. Review the date and time against your team's schedule.
3. Click **"Approve"**.
4. Optionally assign a **GCLT sales representative** to host the visit.
5. The customer receives a notification and email confirmation.

### Rescheduling

1. Open the appointment.
2. Click **"Reschedule"**.
3. Set an alternative date and time.
4. Save — the customer is notified of the new schedule.

### Declining an Appointment

1. Open the appointment.
2. Click **"Decline"**.
3. Optionally add a reason (the customer will be notified).

### Marking an Appointment as Completed

After the viewing has taken place:
1. Open the appointment.
2. Click **"Mark as Completed"**.
3. Update any notes (e.g., "Customer interested, following up with quote").

---

## 12. Customer Management

The **Customers** section gives you a read-only overview of all registered users.

Useful for:
- Looking up a customer's email to contact them directly.
- Verifying user account details if they contact you by phone.
- Reviewing a customer's booking history.
- Checking if a user account is email-verified.

---

## 13. Notifications & System Alerts

### Admin Notifications

Admins receive system alerts for:
- **New Quote Requests** — When a customer submits a new booking.
- **Payment Received** — When a Stripe payment is confirmed.
- **New Viewing Appointment** — When a customer schedules a truck viewing.

Check the **bell icon** in the top navigation bar for unread alerts.

### Sending Custom Notifications

From within any booking details panel, use the **"Send Notification to User"** button to send a status message to the customer.

For custom messages (not tied to a specific booking), use the **Notifications** admin section to compose and send messages to individual users or user groups.

---

## 14. Admin Settings

Click **"Settings"** in the admin sidebar to configure system parameters.

| Setting | Description |
|---|---|
| **Email Templates** | View or customize automated emails (booking confirmation, invoice, status updates) |
| **Fleet Categories** | Adjust the truck category labels and descriptions |
| **Route Rules** | Review auto-routing weight thresholds (default: 3,000 KG = Old Road) |
| **Business Hours** | Update displayed business hours (used in AI assistant responses) |
| **Admin Accounts** | View and manage which user accounts have admin privileges |

---

## 15. Booking Status Reference & Troubleshooting

### Complete Status Reference

| Status | Color | Triggered By | Admin Action Required |
|---|---|---|---|
| **Quote Requested** | 🟡 Yellow | Customer submits booking | ✅ Yes — Review and set a quote |
| **Quoted** | 🔵 Blue | Admin sets a price | ❌ No — Awaiting customer acceptance |
| **Pending Payment** | 🟡 Yellow | Customer accepts quote | ❌ No — Awaiting payment |
| **Confirmed** | 🟢 Green | Payment received | ✅ Yes — Mark as In Transit when truck departs |
| **In Transit** | 🔵 Blue | Admin sets status | ✅ Yes — Mark as Completed upon delivery |
| **Completed** | 🟢 Green | Admin marks complete | ❌ No further action |
| **Cancelled** | 🔴 Red | Admin or customer | ❌ No further action |
| **Declined** | 🔴 Red | Admin | ❌ No further action |

### Common Issues & Solutions

**Issue: Booking is stuck at "Quote Requested" for a long time**  
→ A team member has not reviewed it yet. Filter by `Quote Requested` and process the oldest entries first.

**Issue: Customer says they didn't receive their quote notification**  
→ Check the booking's `userEmail` field in Firestore. Verify the email address is correct. Use the "Send Notification to User" button to resend a push notification to their dashboard.

**Issue: A Stripe payment completed but the booking is still "Pending Payment"**  
→ Check the Stripe dashboard for the webhook event. If the webhook was missed, manually update the booking status to `Confirmed` using the status buttons.

**Issue: A COD customer uploaded the wrong receipt image**  
→ Open the booking details panel, click **"Replace"** under the receipt, and upload the correct image.

**Issue: A truck is appearing in the customer booking wizard but it shouldn't**  
→ Go to **Fleet Management**, find the truck, and set its status to **"In Maintenance"** or toggle `available` to `false`.

---

*GCLT Transport & Trucking Services — Admin Operations Manual*  
*Authorized Personnel Only — Confidential*
