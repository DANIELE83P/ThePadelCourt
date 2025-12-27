# 🚀 Owner Dashboard 2.0 - Setup Instructions

I have implemented all the frontend components for the new Owner Dashboard. However, due to permission restrictions, I could not apply the database changes automatically.

**⚠️ YOU MUST RUN THESE SQL SCRIPTS IN SUPABASE TO MAKE THE APP WORK ⚠️**

Go to your Supabase Dashboard -> SQL Editor -> New Query.
Copy and paste the content of these files (located in your project root):

### 1. Club Profile Setup
**File:** `db_setup.sql`
*   Creates `club_profiles` table.
*   Enables owners to save address, phone, and opening hours.

### 2. Smart Booking System
**File:** `db_bookings.sql`
*   Updates `bookings` table to support "offline" bookings and player names.
*   **Note:** If `player_names` column already exists, the script handles it safely.

### 3. Promo Cards System
**File:** `db_promo.sql`
*   Creates `promo_cards` and `user_credits` tables.
*   Enables creating and selling game packages.

---

## ✅ What's New?

1.  **Tabbed Dashboard**: New layout with side menu (Calendar, Courts, Promo, Settings).
2.  **Club Settings**: You can now edit your contact info and map URL directly from the dashboard. This automatically updates the Footer/Contact section on the Home page.
3.  **Booking Calendar**: A dedicated calendar view for owners to see all bookings (online & offline).
4.  **Manual Bookings**: Click on an empty slot in the owner calendar to create a booking for a walk-in customer (Offline Booking).
5.  **1.5 Hour Slots**: When creating a new court, you can now toggle between 60 min and 90 min slots.
6.  **Promo Cards**: Create "10 Match Pack", "5 Match Pack" etc. (Frontend readiness).

## Next Steps (Phase 2)
Once you confirm these features are working, we will move to the **Competition Engine** (Tournaments & Leagues).
