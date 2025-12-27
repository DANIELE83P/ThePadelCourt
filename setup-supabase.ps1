# Supabase Setup Script
# Questo script configura Supabase CLI e deploya l'Edge Function

Write-Host "=== Supabase Setup ===" -ForegroundColor Cyan

# 1. Check se Supabase CLI è installato
Write-Host "`n1. Controllo Supabase CLI..." -ForegroundColor Yellow

try {
    $version = supabase --version 2>$null
    if ($version) {
        Write-Host "✓ Supabase CLI già installato: $version" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Supabase CLI non trovato" -ForegroundColor Red
    Write-Host "`nInstallazione tramite npm..." -ForegroundColor Yellow
    
    # Prova con npm
    npm install -g supabase --force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Supabase CLI installato con successo!" -ForegroundColor Green
    } else {
        Write-Host "✗ Errore nell'installazione" -ForegroundColor Red
        Write-Host "`nInstallazione manuale richiesta:" -ForegroundColor Yellow
        Write-Host "Visita: https://supabase.com/docs/guides/cli" -ForegroundColor Cyan
        exit 1
    }
}

# 2. Login
Write-Host "`n2. Login a Supabase..." -ForegroundColor Yellow
Write-Host "Si aprirà il browser per l'autenticazione." -ForegroundColor Cyan

supabase login

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Login fallito" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Login completato!" -ForegroundColor Green

# 3. Link progetto
Write-Host "`n3. Collegamento al progetto..." -ForegroundColor Yellow

supabase link --project-ref oncdafptxditoczlgnpa

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Collegamento fallito" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Progetto collegato!" -ForegroundColor Green

# 4. Configura secrets
Write-Host "`n4. Configurazione secrets NotificationAPI..." -ForegroundColor Yellow
Write-Host "Inserisci le credenziali NotificationAPI:" -ForegroundColor Cyan

$clientId = Read-Host "Client ID"
$clientSecret = Read-Host "Client Secret" -AsSecureString
$clientSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($clientSecret)
)

Write-Host "`nImpostazione secrets..." -ForegroundColor Yellow

supabase secrets set "NOTIFICATIONAPI_CLIENT_ID=$clientId"
supabase secrets set "NOTIFICATIONAPI_CLIENT_SECRET=$clientSecretPlain"

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Configurazione secrets fallita" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Secrets configurati!" -ForegroundColor Green

# 5. Deploy Edge Function
Write-Host "`n5. Deploy Edge Function..." -ForegroundColor Yellow

supabase functions deploy send-email-notification

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Deploy fallito" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Edge Function deployata con successo!" -ForegroundColor Green

# 6. Verifica
Write-Host "`n6. Verifica deployment..." -ForegroundColor Yellow

supabase functions list

Write-Host "`n=== Setup Completato! ===" -ForegroundColor Green
Write-Host "`nProssimi step:" -ForegroundColor Cyan
Write-Host "1. Testa l'invio email dalla console browser" -ForegroundColor White
Write-Host "2. Monitora i log: supabase functions logs send-email-notification --tail" -ForegroundColor White
Write-Host "`nPer vedere i logs in real-time:" -ForegroundColor Yellow
Write-Host "supabase functions logs send-email-notification --tail" -ForegroundColor Cyan
