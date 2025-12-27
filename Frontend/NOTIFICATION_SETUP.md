# 📧 NotificationAPI Setup - Custom HTML (Senza Template)

## 🎯 Panoramica

Il sistema è configurato per inviare email con **HTML personalizzato direttamente dal tuo database**, senza bisogno di creare template su NotificationAPI.

### Come Funziona

```
Template DB (email_templates)
    ↓
Edge Function (rendering)
    ↓
NotificationAPI API (invio con custom HTML)
    ↓
Email utente
```

---

## 🔑 Step 1: Ottieni Credenziali NotificationAPI

### 1. Registrazione

1. Vai su [https://app.notificationapi.com](https://app.notificationapi.com)
2. Crea un account o accedi
3. Crea un nuovo progetto

### 2. Credenziali

1. Nel dashboard, vai su **Settings** → **API Keys**
2. Copia:
   - **Client ID** (es. `abc123xyz`)
   - **Client Secret** (es. `secret_key_here`)

**IMPORTANTE:** Conserva queste credenziali in modo sicuro!

---

## 🚀 Step 2: Setup Automatico

Ho creato uno script PowerShell che fa tutto automaticamente.

### Esegui Setup

```powershell
cd c:\Users\danie\ThePadelCourt
.\setup-supabase.ps1
```

Lo script:
1. ✅ Installa Supabase CLI (se necessario)
2. ✅ Login a Supabase
3. ✅ Collega il progetto
4. ✅ Configura i secrets NotificationAPI
5. ✅ Deploya l'Edge Function
6. ✅ Verifica il deployment

**Quando richiesto:**
- Inserisci il **Client ID**
- Inserisci il **Client Secret**

---

## 📝 Setup Manuale (Alternativo)

Se lo script automatico non funziona:

### 1. Installa Supabase CLI

**Opzione A - NPM:**
```powershell
npm install -g supabase --force
```

**Opzione B - Download Diretto:**
1. Vai su [https://github.com/supabase/cli/releases](https://github.com/supabase/cli/releases)
2. Scarica `supabase_windows_amd64.exe`
3. Rinomina in `supabase.exe`
4. Sposta in una cartella nel PATH (es. `C:\Program Files\Supabase\`)

### 2. Login

```powershell
supabase login
```

Si aprirà il browser per l'autenticazione.

### 3. Collega Progetto

```powershell
cd c:\Users\danie\ThePadelCourt
supabase link --project-ref oncdafptxditoczlgnpa
```

### 4. Configura Secrets

```powershell
supabase secrets set NOTIFICATIONAPI_CLIENT_ID=il_tuo_client_id
supabase secrets set NOTIFICATIONAPI_CLIENT_SECRET=il_tuo_client_secret
```

**Sostituisci con le tue credenziali!**

### 5. Deploy Edge Function

```powershell
supabase functions deploy send-email-notification
```

### 6. Verifica

```powershell
supabase functions list
```

Dovresti vedere: `send-email-notification`

---

## ⚙️ Configurazione NotificationAPI Dashboard

### Crea Notification "custom_email"

L'Edge Function usa un ID generico `custom_email` per tutte le email.

**Nel dashboard NotificationAPI:**

1. Vai su **Notifications** → **Create Notification**
2. **Notification ID:** `custom_email`
3. **Channels:** Abilita **Email**
4. **Email Settings:**
   - Template: Lascia VUOTO (usiamo HTML custom)
   - Reply-To: `noreply@thepadelcourt.com` (o il tuo dominio)
   - From Name: `The Padel Court`
5. **Save**

**IMPORTANTE:** NON devi creare template HTML su NotificationAPI! Il nostro sistema invia tutto via API.

---

## 🧪 Test Email

### Test da Console Browser

1. Apri l'app e fai login
2. Apri Developer Tools (F12) → Console
3. Esegui:

```javascript
const { data, error } = await supabase.functions.invoke('send-email-notification', {
  body: {
    to: 'tua-email@example.com',
    templateKey: 'user_credentials',
    variables: {
      firstName: 'Mario',
      email: 'tua-email@example.com',
      password: 'Test123!',
      loginUrl: window.location.origin + '/login',
      clubName: 'The Padel Court'
    },
    userId: 'test-123'
  }
});

console.log('Result:', data, error);
```

4. Controlla la tua email!

---

## 📊 Monitoraggio

### Logs in Real-Time

```powershell
supabase functions logs send-email-notification --tail
```

Mostra tutte le chiamate alla function in tempo reale.

### Logs NotificationAPI Dashboard

1. Vai su NotificationAPI Dashboard
2. **Logs** → Vedi tutte le email inviate
3. Status: Sent, Delivered, Bounced, ecc.

---

## 🔧 Troubleshooting

### Email Non Arrivano

**Check 1: Verifica Secrets**
```powershell
supabase secrets list
```

Dovresti vedere:
- `NOTIFICATIONAPI_CLIENT_ID`
- `NOTIFICATIONAPI_CLIENT_SECRET`

**Check 2: Logs Edge Function**
```powershell
supabase functions logs send-email-notification --tail
```

Cerca errori tipo:
- "Template not found" → Template non attivo nel DB
- "NotificationAPI error 401" → Credenziali sbagliate
- "NotificationAPI error 403" → Controlla notification `custom_email`

**Check 3: NotificationAPI Dashboard**

Vai su **Logs** e cerca l'email. Stati possibili:
- ✅ **Sent** → Inviata
- ✅ **Delivered** → Consegnata
- ⚠️ **Bounced** → Email non valida
- ⚠️ **Spam** → Finita in spam (controlla cartella)

### Edge Function Non Deploya

**Errore: "Project not linked"**

Soluzione:
```powershell
supabase link --project-ref oncdafptxditoczlgnpa
```

**Errore: "supabase: command not found"**

Supabase CLI non installato correttamente. Riprova l'installazione o usa il download diretto.

### Secrets Non Si Settano

Assicurati di essere autenticato:
```powershell
supabase login
```

---

## ✅ Verifica Setup Completo

Dopo aver completato tutti gli step:

### 1. Test Manuale

Owner Dashboard → Utenti → Crea nuovo utente

→ L'utente dovrebbe ricevere email con credenziali!

### 2. Test Scanner

Scanner → Aggiungi timbro → Utente riceve notifica email (se abilitata)

### 3. Test Preferenze

Owner Dashboard → Impostazioni → Notifiche → Disabilita email per un evento

→ L'email non viene più inviata per quell'evento!

---

## 🎨 Personalizzazione Template

### Modifica Template

1. Owner Dashboard → Utenti → **Template Email**
2. Click "Modifica" su un template
3. Cambia oggetto e HTML
4. **Anteprima** per verificare
5. Salva

Le modifiche vengono applicate **immediatamente** alle prossime email!

### Variabili Disponibili

Ogni template ha le sue variabili. Esempio per `user_credentials`:

- `{{firstName}}` - Nome utente
- `{{email}}` - Email utente
- `{{password}}` - Password temporanea
- `{{loginUrl}}` - Link login
- `{{clubName}}` - Nome club

**Condizionali:**
```html
{{#if credits}}
  Hai {{credits}} partite disponibili!
{{/if}}
```

---

## 📈 Vantaggi di Questo Approccio

✅ **Template nel tuo database** - Modifica senza toccare NotificationAPI  
✅ **Anteprima live** - Vedi come appare prima di salvare  
✅ **Storico versioni** - Tutte le modifiche tracciate  
✅ **No vendor lock-in** - Cambi provider email facilmente  
✅ **Preferenze utente** - Controllo granulare per ogni tipo di notifica  

---

## 🚀 Sistema Pronto!

Una volta completato il setup:

1. ✅ Edge Function deployata
2. ✅ NotificationAPI configurato
3. ✅ Template personalizzabili nell'app
4. ✅ Email automatiche funzionanti

**Tutto operativo per la produzione!** 🎉
