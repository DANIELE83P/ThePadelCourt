# 🎾 Court Management - Migrato a Supabase Diretto

## ✅ Problema Risolto

**Errore**: `401 Unauthorized` quando si cercava di creare/gestire campi

**Causa**: Il frontend chiamava il backend (`/api/createcourt`) che richiedeva autenticazione JWT, ma ora usiamo Supabase Auth direttamente.

**Soluzione**: Migrato completamente la gestione campi per usare Supabase direttamente senza backend!

---

## 🔧 Modifiche Apportate

### 1. **CreateCourtModal (modul.jsx)** ✅
`Frontend/src/Owner/modul.jsx`

**Prima**:
```javascript
await axios.post(`${API_URL}/createcourt`, formData, {
  withCredentials: true
});
```

**Ora**:
```javascript
// Upload immagine a Supabase Storage
const { error } = await supabase.storage
  .from('courts')
  .upload(filePath, courtData.courtImg);

// Crea campo nel database
const { data } = await supabase
  .from('courts')
  .insert({ ...courtData })
  .select()
  .single();

// Genera availability automaticamente
await supabase
  .from('court_availability')
  .insert(availabilityRecords);
```

**Funzionalità**:
- ✅ Upload immagini su Supabase Storage
- ✅ Creazione campo direttamente su Supabase
- ✅ Generazione automatica availability
- ✅ Validazione input
- ✅ Gestione errori migliorata
- ✅ Loading states

### 2. **Proj.jsx - Court List** ✅
`Frontend/src/Owner/Proj.jsx`

**Modifiche**:
- ✅ Fetch campi da Supabase invece del backend
- ✅ Update campi direttamente su Supabase
- ✅ Delete campi con cascade automatico
- ✅ Real-time refresh dopo operazioni

**Funzioni migrate**:
```javascript
// Fetch courts
const { data } = await supabase
  .from('courts')
  .select('*')
  .eq('owner_id', user.id);

// Update court
await supabase
  .from('courts')
  .update({ name, location, price_per_hour })
  .eq('id', courtId);

// Delete court
await supabase
  .from('courts')
  .delete()
  .eq('id', courtId);
```

### 3. **Supabase Storage Bucket** ✅

Creato bucket `courts` per le immagini con policies:
- ✅ Chiunque può vedere le immagini (public)
- ✅ Solo utenti autenticati possono caricare
- ✅ Solo il proprietario può modificare/eliminare

---

## 🎯 Flusso Completo

### Creazione Campo

1. **Owner clicca "Create Stadium"**
2. **Compila il form**:
   - Nome campo
   - Località
   - Orario inizio/fine
   - Prezzo per ora
   - Giorni in anticipo
   - Immagine (opzionale)
3. **Submit**:
   ```
   Upload immagine → Supabase Storage
   ↓
   Crea record in courts table
   ↓
   Genera availability per N giorni
   ↓
   Refresh lista campi
   ↓
   Mostra successo
   ```

### Modifica Campo

1. **Owner clicca "Edit" su un campo**
2. **Modifica i dati** nel modal
3. **Save**:
   ```
   Update record in courts table
   ↓
   Refresh lista campi
   ↓
   Mostra successo
   ```

### Eliminazione Campo

1. **Owner clicca "Delete"**
2. **Conferma eliminazione**
3. **Delete**:
   ```
   Delete record from courts table
   ↓
   Cascade delete: bookings, availability
   ↓
   Refresh lista campi
   ↓
   Mostra successo
   ```

---

## 🧪 Test

### 1. Crea un Campo
1. Vai su `http://localhost:5173/ownerpage`
2. Clicca "Create Stadium"
3. Compila il form:
   - Name: "Campo Centrale"
   - Location: "Via Roma 1, Milano"
   - Start Hour: "08:00"
   - End Hour: "22:00"
   - Price: "25"
   - Days: "30"
   - Image: (opzionale)
4. Clicca "Submit"
5. Dovresti vedere il nuovo campo nella lista! 🎉

### 2. Verifica nel Database
Vai su Supabase Dashboard:
- Table Editor → `courts` → Dovresti vedere il tuo campo
- Table Editor → `court_availability` → Dovresti vedere gli slot generati
- Storage → `courts` → Dovresti vedere l'immagine (se caricata)

### 3. Modifica un Campo
1. Clicca "Edit" su un campo
2. Modifica il prezzo
3. Salva
4. Verifica che il prezzo sia aggiornato

### 4. Elimina un Campo
1. Clicca "Delete" su un campo
2. Conferma
3. Il campo dovrebbe sparire dalla lista

---

## 🔍 Struttura Dati

### Court Record
```json
{
  "id": "uuid",
  "name": "Campo Centrale",
  "location": "Via Roma 1, Milano",
  "operating_hours_start": "8",
  "operating_hours_end": "22",
  "price_per_hour": 25.00,
  "owner_id": "user-uuid",
  "court_img_url": "https://...supabase.co/storage/...",
  "court_img_public_id": "court-images/...",
  "created_at": "2025-12-26T...",
  "updated_at": "2025-12-26T..."
}
```

### Availability Records (generati automaticamente)
```json
{
  "id": "uuid",
  "court_id": "court-uuid",
  "available_date": "2025-12-27",
  "time_slot_start": "8:00 AM",
  "time_slot_end": "9:00 AM",
  "is_available": true
}
```

---

## 🚨 Risoluzione Problemi

### Errore: "Failed to create court"

**Soluzione 1**: Verifica che tutti i campi siano compilati
**Soluzione 2**: Controlla la console per errori specifici
**Soluzione 3**: Verifica che l'utente sia autenticato

### Errore: "Upload failed"

**Causa**: Bucket storage non configurato correttamente

**Soluzione**: Il bucket è già stato creato, ma se hai problemi:
1. Vai su Supabase Dashboard
2. Storage → Buckets
3. Verifica che esista il bucket "courts"
4. Verifica che sia pubblico

### Immagine non si vede

**Soluzione**: 
1. Verifica che il bucket sia pubblico
2. Controlla l'URL dell'immagine nella console
3. Prova a ricaricare la pagina

### Campi non si caricano

**Soluzione**:
1. Verifica di essere loggato come owner
2. Controlla la console per errori
3. Verifica che `user.id` sia definito

---

## 📊 Vantaggi della Nuova Implementazione

### 1. **Nessun Backend Necessario**
- ❌ Prima: Frontend → Backend → Supabase
- ✅ Ora: Frontend → Supabase (diretto)

### 2. **Più Veloce**
- Meno latenza (un hop in meno)
- Upload immagini diretto a Storage

### 3. **Più Sicuro**
- RLS policies proteggono i dati
- Storage policies proteggono le immagini
- Nessun JWT custom da gestire

### 4. **Real-time Ready**
- Facile aggiungere subscriptions
- Aggiornamenti automatici quando altri owner modificano

### 5. **Scalabile**
- Supabase gestisce tutto
- Nessun server da mantenere
- Auto-scaling incluso

---

## 🚀 Prossimi Passi Opzionali

### 1. Real-time Updates
```javascript
// Ascolta cambiamenti ai campi
supabase
  .channel('courts-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'courts' },
    (payload) => {
      console.log('Court changed!', payload);
      fetchCourts(); // Refresh automatico
    }
  )
  .subscribe();
```

### 2. Image Optimization
- Resize automatico immagini
- Generazione thumbnails
- Compressione automatica

### 3. Bulk Operations
- Crea multipli campi contemporaneamente
- Import da CSV
- Clone campo esistente

---

## ✨ Conclusione

**La gestione campi ora funziona completamente con Supabase!** 🎉

- ✅ Creazione campi funzionante
- ✅ Upload immagini su Supabase Storage
- ✅ Modifica campi funzionante
- ✅ Eliminazione campi funzionante
- ✅ Nessun errore 401
- ✅ Nessun backend necessario

**Prova ora a creare il tuo primo campo!** 🎾
