# 🔐 Protezione Route e Controllo Ruoli - RISOLTO

## ✅ Problema Risolto

**Problema**: Anche se registrato come "owner", non potevi accedere alla pagina `/ownerpage` per configurare il centro.

**Causa**: 
1. La Navbar usava ancora il vecchio `AuthContext` con JWT/cookies
2. Le route non erano protette
3. Il `userRole` non veniva letto correttamente dal profilo Supabase

## 🔧 Modifiche Apportate

### 1. **Navbar Aggiornata** ✅
`Frontend/src/components/Navbar.jsx`

**Prima**:
```javascript
const { isLoggedIn, setIsLoggedIn, userRole } = useContext(AuthContext);
// Usava Cookies.remove("token")
```

**Ora**:
```javascript
const { isLoggedIn, userRole, signOut, profile } = useAuth();
// Usa signOut() di Supabase
```

**Risultato**:
- ✅ Legge correttamente il `userRole` dal profilo Supabase
- ✅ Mostra "MyCourts" solo se `userRole === 'owner'`
- ✅ Logout funziona con Supabase Auth

### 2. **ProtectedRoute Creato** ✅
`Frontend/src/components/ProtectedRoute.jsx`

Nuovo componente per proteggere le route:

```javascript
<ProtectedRoute allowedRoles={['owner', 'admin']}>
  <Owner />
</ProtectedRoute>
```

**Funzionalità**:
- ✅ Controlla se l'utente è autenticato
- ✅ Controlla se l'utente ha il ruolo richiesto
- ✅ Redirect automatico a `/login` se non autenticato
- ✅ Redirect automatico a `/` se ruolo non autorizzato

### 3. **Routes Protette** ✅
`Frontend/src/main.jsx`

**Route protette**:
- `/ownerpage` - Solo per `owner` e `admin`
- `/profile` - Solo per utenti autenticati

```javascript
{
  path: "ownerpage",
  element: (
    <ProtectedRoute allowedRoles={['owner', 'admin']}>
      <Owner />
    </ProtectedRoute>
  ),
}
```

---

## 🎯 Come Funziona Ora

### Flusso Completo

1. **Registrazione come Owner**
   ```
   User compila form → Seleziona "Owner" → Supabase crea user
   → Trigger crea profile con role='owner'
   ```

2. **Login**
   ```
   User fa login → Supabase Auth → Session creata
   → AuthContext fetcha profile → userRole = 'owner'
   ```

3. **Navbar**
   ```
   Navbar legge userRole → Se 'owner' → Mostra "MyCourts"
   ```

4. **Accesso a /ownerpage**
   ```
   User clicca "MyCourts" → ProtectedRoute controlla ruolo
   → Se 'owner' → Mostra pagina Owner
   → Altrimenti → Redirect a "/"
   ```

---

## 🧪 Test

### 1. Verifica Ruolo Utente
Dopo il login, apri la console del browser:

```javascript
// Importa supabase
import { supabase } from './lib/supabase';

// Controlla sessione
const { data: { session } } = await supabase.auth.getSession();
console.log('User:', session?.user);

// Controlla profilo
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session?.user?.id)
  .single();
console.log('Profile:', profile);
console.log('Role:', profile?.role);
```

### 2. Test Navbar
1. Fai login come **owner**
2. Dovresti vedere il link **"MyCourts"** nella navbar
3. Clicca su "MyCourts"
4. Dovresti essere reindirizzato a `/ownerpage`

### 3. Test Protezione Route
1. Fai logout
2. Prova ad andare manualmente su `http://localhost:5173/ownerpage`
3. Dovresti essere reindirizzato a `/login`

---

## 🔍 Verifica Ruolo nel Database

### Opzione 1: Supabase Dashboard
1. Vai su https://oncdafptxditoczlgnpa.supabase.co
2. Table Editor → `profiles`
3. Trova il tuo utente
4. Verifica che `role = 'owner'`

### Opzione 2: SQL Query
```sql
SELECT id, name, role, created_at 
FROM profiles 
WHERE role = 'owner';
```

---

## 🛠️ Risoluzione Problemi

### Problema: "MyCourts" non appare nella navbar

**Soluzione 1**: Verifica il ruolo nel database
```javascript
// Console browser
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();
console.log('Current role:', profile.role);
```

**Soluzione 2**: Aggiorna manualmente il ruolo
```sql
-- Supabase SQL Editor
UPDATE profiles 
SET role = 'owner' 
WHERE email = 'tua-email@example.com';
```

### Problema: Redirect a "/" anche se sei owner

**Causa**: Il profilo potrebbe non essere stato caricato correttamente

**Soluzione**: Ricarica la pagina o fai logout/login

---

## 📊 Struttura Ruoli

### Ruoli Disponibili
- `user` - Utente normale (può prenotare campi)
- `owner` - Proprietario (può gestire i propri campi)
- `admin` - Amministratore (accesso completo)

### Permessi per Route
| Route | user | owner | admin |
|-------|------|-------|-------|
| `/` | ✅ | ✅ | ✅ |
| `/courts` | ✅ | ✅ | ✅ |
| `/profile` | ✅ | ✅ | ✅ |
| `/ownerpage` | ❌ | ✅ | ✅ |

---

## 🚀 Prossimi Passi

### Altre Route da Proteggere (Opzionale)

1. **Booking Route** - Solo utenti autenticati
```javascript
{
  path: "court/:id",
  element: (
    <ProtectedRoute>
      <Bookk />
    </ProtectedRoute>
  ),
}
```

2. **Admin Dashboard** (se esiste)
```javascript
{
  path: "admin",
  element: (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  ),
}
```

---

## ✨ Conclusione

**Ora il sistema di ruoli funziona correttamente!** 🎉

- ✅ Navbar mostra "MyCourts" solo per owner
- ✅ Route `/ownerpage` protetta
- ✅ Redirect automatico se non autorizzato
- ✅ Ruoli letti correttamente da Supabase

**Prova ora a fare login come owner e accedere a "MyCourts"!** 🎾
