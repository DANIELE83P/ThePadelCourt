/**
 * Email Templates for NotificationAPI
 * 
 * Questi template vengono configurati nel pannello di NotificationAPI.
 * Ogni template deve essere creato manualmente nel dashboard con i merge tags specificati.
 * 
 * Come usare:
 * 1. Vai su https://app.notificationapi.com/notifications
 * 2. Crea una nuova notifica per ogni template qui sotto
 * 3. Usa l'ID esattamente come specificato (es. 'user_credentials')
 * 4. Copia il contenuto del template e configura i merge tags
 */

export const EMAIL_TEMPLATES = {

    /**
     * USER_CREDENTIALS - Invio credenziali nuovo utente
     * Trigger: Quando l'admin crea un nuovo utente
     * Channel: Email (+ opzionale SMS)
     */
    user_credentials: {
        id: 'user_credentials',
        name: 'Invio Credenziali Utente',
        description: 'Email automatica con username e password temporanea',
        mergeTags: {
            firstName: 'Nome dell\'utente',
            email: 'Email di login',
            password: 'Password temporanea',
            loginUrl: 'Link diretto al login',
            clubName: 'Nome del club'
        },
        subject: '🎾 Benvenuto su {{clubName}} - Le tue credenziali di accesso',
        emailBody: `
Ciao {{firstName}},

Il tuo account su {{clubName}} è stato creato con successo!

🔐 **Le tue credenziali di accesso:**
- Email: {{email}}
- Password: {{password}}

⚠️ **IMPORTANTE**: Per motivi di sicurezza, al primo accesso ti verrà richiesto di cambiare la password.

👉 Accedi ora: {{loginUrl}}

Se hai domande o necessiti di assistenza, non esitare a contattarci.

A presto in campo!
Team {{clubName}}
        `,
        smsBody: `Ciao {{firstName}}! Il tuo account {{clubName}} è pronto. Email: {{email}}, Password: {{password}}. Cambia la password al primo accesso: {{loginUrl}}`
    },

    /**
     * CARD_ASSIGNED - Assegnazione carta promo o fidelity
     * Trigger: Quando l'admin assegna una carta a un utente
     */
    card_assigned: {
        id: 'card_assigned',
        name: 'Assegnazione Carta',
        description: 'Notifica quando viene assegnata una carta promo o fedeltà',
        mergeTags: {
            firstName: 'Nome utente',
            cardType: 'PROMO o LOYALTY',
            cardName: 'Nome carta/programma',
            credits: 'Partite incluse (solo promo)',
            stampsRequired: 'Timbri necessari (solo loyalty)',
            reward: 'Descrizione premio (solo loyalty)'
        },
        subject: '🎁 Hai ricevuto una nuova carta: {{cardName}}',
        emailBody: `
Ciao {{firstName}},

Ottima notizia! Ti è stata assegnata una nuova carta.

📋 **Dettagli:**
- Tipologia: {{cardType}}
- Nome: {{cardName}}
{{#if credits}}- Partite incluse: {{credits}}{{/if}}
{{#if stampsRequired}}- Timbri richiesti: {{stampsRequired}}
- Premio: {{reward}}{{/if}}

Mostra il QR Code della tua carta alla reception per usarla!

🔗 Visualizza le tue carte: {{cardsUrl}}

Buon divertimento!
Team {{clubName}}
        `,
        smsBody: `Nuova carta assegnata: {{cardName}}! {{#if credits}}{{credits}} partite disponibili.{{/if}} Mostra il QR alla reception.`
    },

    /**
     * CARD_USAGE - Conferma utilizzo carta
     * Trigger: Dopo ogni scansione/utilizzo carta
     */
    card_usage: {
        id: 'card_usage',
        name: 'Utilizzo Carta',
        description: 'Conferma dopo aver scalato una partita o aggiunto un timbro',
        mergeTags: {
            firstName: 'Nome utente',
            cardName: 'Nome carta',
            action: 'Azione eseguita (es. "Partita scalata", "Timbro aggiunto")',
            remaining: 'Partite/timbri rimanenti',
            date: 'Data e ora utilizzo'
        },
        subject: '✅ Ingresso registrato - {{cardName}}',
        emailBody: `
Ciao {{firstName}},

Il tuo ingresso è stato registrato con successo!

📊 **Riepilogo:**
- Carta: {{cardName}}
- Azione: {{action}}
- Rimanenti: {{remaining}}
- Data: {{date}}

Continua così!
Team {{clubName}}
        `,
        smsBody: `Ingresso OK! {{cardName}}: {{action}}. Rimanenti: {{remaining}}.`
    },

    /**
     * LOW_BALANCE - Saldo in esaurimento
     * Trigger: Quando rimangono poche partite (es. <= 2)
     */
    low_balance: {
        id: 'low_balance',
        name: 'Saldo Basso',
        description: 'Avviso quando le partite stanno per esaurirsi',
        mergeTags: {
            firstName: 'Nome utente',
            cardName: 'Nome carta',
            remaining: 'Partite rimanenti',
            renewUrl: 'Link per acquistare nuova carta'
        },
        subject: '⚠️ Attenzione: solo {{remaining}} partite rimaste',
        emailBody: `
Ciao {{firstName}},

Ti avvisiamo che la tua carta **{{cardName}}** sta per esaurirsi.

🔔 Partite rimanenti: **{{remaining}}**

Per non perdere neanche un match, rinnova subito la tua carta!

👉 Acquista ora: {{renewUrl}}

Ci vediamo in campo!
Team {{clubName}}
        `,
        smsBody: `Attenzione! Solo {{remaining}} partite rimaste su {{cardName}}. Rinnova ora per continuare a giocare!`
    },

    /**
     * REWARD_UNLOCKED - Premio fedeltà sbloccato
     * Trigger: Quando si raggiunge il target di timbri
     */
    reward_unlocked: {
        id: 'reward_unlocked',
        name: 'Premio Sbloccato',
        description: 'Congratulazioni per aver completato il programma fedeltà',
        mergeTags: {
            firstName: 'Nome utente',
            programName: 'Nome programma',
            reward: 'Descrizione premio',
            totalRewards: 'Totale premi guadagnati'
        },
        subject: '🎉 Congratulazioni! Hai sbloccato un premio!',
        emailBody: `
Ciao {{firstName}},

🏆 **HAI RAGGIUNTO IL TRAGUARDO!**

Complimenti per aver completato il programma **{{programName}}**!

🎁 Il tuo premio: **{{reward}}**

Passa in reception per riscattarlo!

📈 Premi totali guadagnati: {{totalRewards}}

Grazie per la tua fedeltà!
Team {{clubName}}
        `,
        smsBody: `🎉 PREMIO SBLOCCATO! {{reward}} - Programma {{programName}}. Passa in reception per ritirarlo!`
    },

    /**
     * STAMP_ADDED - Timbro aggiunto (opzionale, se si vuole notificare ogni timbro)
     * Trigger: Dopo ogni aggiunta di timbro
     */
    stamp_added: {
        id: 'stamp_added',
        name: 'Timbro Aggiunto',
        description: 'Notifica dopo ogni timbro raccolto',
        mergeTags: {
            firstName: 'Nome utente',
            programName: 'Nome programma',
            currentStamps: 'Timbri attuali',
            totalRequired: 'Timbri necessari',
            remaining: 'Timbri mancanti'
        },
        subject: '⭐ Nuovo timbro raccolto - {{programName}}',
        emailBody: `
Ciao {{firstName}},

Ottimo lavoro! Hai raccolto un nuovo timbro.

📊 **Progressi {{programName}}:**
- Timbri raccolti: {{currentStamps}}/{{totalRequired}}
- Mancano solo: {{remaining}} timbri!

Continua così, sei sempre più vicino al premio!

Team {{clubName}}
        `,
        smsBody: `⭐ Timbro aggiunto! {{currentStamps}}/{{totalRequired}} - Mancano {{remaining}} timbri al premio!`
    },

    /**
     * BOOKING_CONFIRMED - Conferma prenotazione (bonus)
     * Trigger: Dopo la prenotazione di un campo
     */
    booking_confirmed: {
        id: 'booking_confirmed',
        name: 'Conferma Prenotazione',
        description: 'Email di conferma dopo aver prenotato un campo',
        mergeTags: {
            firstName: 'Nome utente',
            courtName: 'Nome campo',
            date: 'Data prenotazione',
            time: 'Orario',
            duration: 'Durata',
            price: 'Prezzo'
        },
        subject: '✅ Prenotazione confermata - {{courtName}}',
        emailBody: `
Ciao {{firstName}},

La tua prenotazione è confermata!

🎾 **Dettagli:**
- Campo: {{courtName}}
- Data: {{date}}
- Orario: {{time}}
- Durata: {{duration}}
- Importo: €{{price}}

Ci vediamo in campo!
Team {{clubName}}
        `,
        smsBody: `Prenotazione OK! {{courtName}} - {{date}} alle {{time}}. Ci vediamo li!`
    }
};

/**
 * Helper function per ottenere un template
 */
export const getTemplate = (templateId) => {
    return EMAIL_TEMPLATES[templateId] || null;
};

/**
 * Lista di tutti gli ID template per validazione
 */
export const TEMPLATE_IDS = Object.keys(EMAIL_TEMPLATES);

export default EMAIL_TEMPLATES;
