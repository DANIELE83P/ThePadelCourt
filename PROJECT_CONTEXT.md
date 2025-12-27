# PROJECT CONTEXT - The Padel Court

## 📄 Descrizione
**The Padel Court** è una piattaforma completa per la gestione di centri sportivi di Padel. Si divide in due macro-aree:
1. **Frontend Utente**: Permette ai giocatori di prenotare campi, gestire il proprio profilo, visualizzare le proprie card (promo e fidelity) e ricevere notifiche.
2. **Dashboard Owner (2.0)**: Un sistema gestionale avanzato per i proprietari del club per gestire prenotazioni, listini prezzi, programmi fedeltà, chiusure, orari e analytics.

---

## 🛠 Tecnologia
- **Frontend**: React (Vite)
- **Styling**: Tailwind CSS (per la nuova UI) + Bootstrap (legacy/utilità) + Vanilla CSS
- **Backend/Database**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Stato/Auth**: Context API + Supabase Auth
- **Notifiche**: Integrazione con NotificationAPI e regole personalizzate
- **Lingua**: Italiano (i18next)
- **Librerie Chiave**: Lucide React (icone), Framer Motion (animazioni), jsPDF/QRCode (generazione card), date-fns (date).

---

## ✅ Funzionalità Implementate

### Area Cliente
- **Autenticazione**: Login (anche Social), Registrazione, Recupero Password.
- **Profilo**: Gestione dati personali.
- **Le Mie Card**:
    - Visualizzazione pacchetti partite (Promo Cards).
    - Visualizzazione Fidelity Cards con progresso timbri.
    - Download PDF della card con QR Code scaricabile.
    - **Aggiunta a Google Wallet** (Placeholder logico pronto per integrazione API).
- **Prenotazioni**: Visualizzazione cronologia e stato prenotazioni.

### Dashboard Owner (2.0)
- **Home**: Panoramica rapida e statistiche.
- **Gestione Prenotazioni**: Calendario avanzato (Day, Week, Month, Agenda) con supporto a slot configurabili (es. 90 min).
- **Configurazione Club**:
    - Orari di apertura/chiusura.
    - Chiusure straordinarie.
    - Listini prezzi dinamici per campo/orario.
- **Marketing & Fedeltà**:
    - Creazione e gestione Promo Cards (pacchetti).
    - Programmi Loyalty (timbri e premi).
    - Assegnazione manuale di card agli utenti.
- **Comunicazione**:
    - Gestione template email.
    - Invio comunicazioni/annunci.
- **User Management**: Gestione completa dell'anagrafica utenti del club.
- **Universal Scanner**: Sistema per scansionare le card dei clienti via QR Code.

---

## 🚀 Idee e Sviluppi Futuri
- **Integrazione Pagamenti**: Stripe per l'acquisto di pacchetti e prenotazioni online.
- **Match Making**: Sistema per trovare compagni di gioco basato sul livello.
- **Analytics Avanzati**: Report dettagliati sui ricavi e l'occupazione dei campi.
- **AI Assistant**: Integrazione chat/voice per prenotazioni rapide via WhatsApp (in fase di test).
- **Integrazione Google Wallet API**: Passare dal placeholder alla generazione reale del JWT per aggiungere le card.

---

## 📐 Specifiche Tecniche
- **Database Schema**:
    - `profiles`: Dati utenti.
    - `bookings`: Prenotazioni campi.
    - `promo_cards` / `user_promo_cards`: Definizioni e istanze pacchetti.
    - `loyalty_programs` / `user_loyalty_cards`: Definizioni e istanze fidelity.
    - `club_settings`: Orari e info club.
- **Infrastruttura**: Deployment su Vercel/Netlify (Frontend) e Supabase (Backend).

---
*Ultimo Aggiornamento: 2025-12-28*
