# 🎾 THE PADEL COURT - DOCUMENTAZIONE TECNICA E DI CONTESTO (v2.0)

Questo documento rappresenta la "Single Source of Truth" (SSOT) per lo sviluppo e la manutenzione della piattaforma **The Padel Court**. È progettato per fornire a sviluppatori e AI un contesto immediato, profondo e tecnico su ogni aspetto del sistema.

---

## 🏗️ 1. ARCHITETTURA DEL SISTEMA

### **Frontend (Vite + React)**
- **Framework base**: React 18.
- **Routing**: `react-router-dom` con rotte protette (`ProtectedRoute.jsx`).
- **State Management**: React Context API (`AuthContext`, `ThemeContext`).
- **Internazionalizzazione**: `i18next` con focus primario sulla lingua **Italiana**.
- **UI/UX**: 
    - **Aesthetics**: Design premium, dark mode di default per la sezione Owner.
    - **Librerie UI**: Tailwind CSS (per la nuova UI 2.0), HeadlessUI, Framer Motion (animazioni), Bootstrap (limitato allo stretto necessario).
    - **Iconografia**: Lucide React.
    - **Visualizzazione**: `react-slick` per caroselli, `date-fns` per manipolazione date.

### **Backend & Database (Supabase)**
- **Database**: PostgreSQL ospitato su Supabase.
- **Autenticazione**: Supabase Auth (Email/Password + Social Login).
- **Storage**: Supabase Storage per immagini campi (`courts` bucket) e QR code.
- **Logica Server**: Supabase Edge Functions (Deno) per invio email e logica complessa.
- **SDK**: `@supabase/supabase-js`.

---

## 📊 2. MODELLO DATI (SCHEMA DATABASE)

### **Core**
- **`profiles`**: Estensione di `auth.users`. Contiene `full_name`, `email`, `phone`, `role`.
- **`courts`**: Definisce i campi (nome, location, indoor/outdoor, prezzo_ora, orari_operativi, features, immagine).
- **`court_availability`**: Tabella pivot fondamentale. Genera gli slot temporali (es. 09:00-10:30) per ogni data. Colonna chiave: `is_available`.
- **`bookings`**: Registra le prenotazioni confermate. Collega `court_id` e `user_id`. Gestisce `player_names` (array) e `booking_type` (online/offline).

### **Loyalty & Marketing**
- **`promo_cards`**: Definizioni dei pacchetti partite (es. "Pacchetto 10 partite").
- **`user_promo_cards`**: Istanze vendute agli utenti. Traccia `remaining_credits`.
- **`loyalty_programs`**: Definizioni programmi a timbri (es. "Ogni 10 partite, 1 gratis").
- **`user_loyalty_cards`**: Traccia il progresso dei timbri (`current_stamps`) per il singolo utente.

### **Configurazione**
- **`club_settings`**: Orari globali, info contatto, logo club.
- **`closures`**: Gestione chiusure straordinarie dei campi.

---

## ⚙️ 3. LOGICA DI BUSINESS FONDAMENTALE

### **Il Motore delle Prenotazioni (Booking Engine)**
- **Generazione Slot**: La logica risiede in `modul.jsx`. Quando un campo viene creato, il sistema genera automaticamente slot di disponibilità (default 90 min) per un numero di giorni configurabile (`days_in_advance`).
- **Format Orario**: Utilizza internamente un formato 12h (AM/PM) per compatibilità database storica, ma visualizza sempre nel frontend in **24h** per il mercato italiano.
- **Validazione**: Le prenotazioni online scalano crediti dalle `user_promo_cards` o richiedono pagamento (futuro). Le prenotazioni offline (manuali da dashboard) permettono di inserire nomi manualmente senza che l'utente sia registrato.

### **Sistema Loyalty & Promo**
- **QR Code**: Ogni card utente (`UserCards.jsx`) ha un QR code univoco generato via `qrcode.js`.
- **Validazione**: L'owner usa `UniversalScanner.jsx` (basato su `html5-qrcode`) per scansionare il QR del cliente e scalare un credito o aggiungere un timbro istantaneamente.
- **Wallet**: Integrazione placeholder per **Google Wallet**. Permette il download della card in formato PDF (`jspdf`) come fallback sicuro.

---

## 🖥️ 4. DASHBOARD OWNER (2.0)

La sezione amministrativa è situata in `/src/Owner` e segue uno standard estetico elevato:
- **`OwnerLayout.jsx`**: Sidebar persistente, navigazione fluida e gestione stato globale dashboard.
- **`BookingCalendar.jsx`**: Il centro di controllo. 4 viste:
    - **Day**: Griglia verticale oraria per campo. Filtri per Mattina/Pomeriggio/Sera.
    - **Week/Month**: Panoramica occupazione.
    - **Agenda**: Lista cronologica pulita delle prenotazioni.
- **`NewBookingModal.jsx`**: Gestisce la creazione rapida di prenotazioni, ricerca utenti in anagrafica e invio notifiche di conferma (Email/SMS).
- **`AnalyticsDashboard.jsx`**: Visualizzazione performance del club.

---

## 🚀 5. ROADMAP SVILUPPO (DA COMPLETARE)

### **In Breve Termine**
- [ ] **Google Wallet API Integration**: Passare dal pulsante placeholder alla generazione reale del file JWT via Edge Function.
- [ ] **Pagamenti Online**: Integrazione con Stripe per l'acquisto di Promo Cards direttamente dall'area utente.
- [ ] **Email Service**: Completare il `TODO` in `NewBookingModal` usando il servizio `send-email-notification` (Supabase Edge Function).

### **In Lungo Termine**
- [ ] **AI Reservation Assistant**: Espansione del Bot WhatsApp/Voice per gestire prenotazioni in linguaggio naturale sincronizzate con `court_availability`.
- [ ] **Gestore Tornei**: Modulo per creare e gestire campionati sociali e tornei lampo.

---

## 🛠️ 6. MANUTENZIONE & SVILUPPO

### **Sincronizzazione Contesto**
Ogni volta che viene effettuata una modifica strutturale (nuovi file, nuove tabelle DB, cambi logica):
1. Aggiornare le sezioni pertinenti di questo file.
2. Eseguire `node scripts/sync_context.js` per aggiornare il timestamp.

### **Workflow Git**
- I commit devono essere descrittivi (es. `feat: added google wallet button`, `fix: corrected time format in calendar`).
- Sincronizzare sempre prima di iniziare una nuova sessione di coding con un'AI per garantire che il contesto sia aggiornato.

---
*Ultimo Aggiornamento: 2025-12-27*
