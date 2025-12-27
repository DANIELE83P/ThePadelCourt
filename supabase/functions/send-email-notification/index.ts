// Supabase Edge Function: send-email-notification
// Sends emails via NotificationAPI with custom HTML (no template required on their side)
// Deploy: supabase functions deploy send-email-notification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// NotificationAPI Configuration
const NOTIFICATIONAPI_CLIENT_ID = Deno.env.get('NOTIFICATIONAPI_CLIENT_ID')!
const NOTIFICATIONAPI_CLIENT_SECRET = Deno.env.get('NOTIFICATIONAPI_CLIENT_SECRET')!

// Supabase Configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface EmailPayload {
    to: string
    templateKey: string
    variables: Record<string, any>
    userId?: string
}

serve(async (req) => {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Parse request
        const { to, templateKey, variables, userId }: EmailPayload = await req.json()

        console.log('[send-email] Processing:', { to, templateKey, userId })

        // Create Supabase client
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        // 1. Check notification preferences
        const { data: preference } = await supabase
            .from('notification_preferences')
            .select('send_email')
            .eq('event_type', templateKey.toUpperCase())
            .single()

        if (preference && !preference.send_email) {
            console.log('[send-email] Email disabled for event:', templateKey)
            return new Response(
                JSON.stringify({ success: true, message: 'Email disabled by preferences' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Fetch template from database
        const { data: template, error: templateError } = await supabase
            .from('email_templates')
            .select('*')
            .eq('template_key', templateKey)
            .eq('is_active', true)
            .single()

        if (templateError || !template) {
            throw new Error(`Template not found: ${templateKey}`)
        }

        // 3. Render template with variables
        let subject = template.subject
        let htmlBody = template.html_body

        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g')
            const value = variables[key] || ''
            subject = subject.replace(regex, value)
            htmlBody = htmlBody.replace(regex, value)
        })

        // Handle conditionals {{#if variable}}...{{/if}}
        const conditionalRegex = /{{#if\s+(\w+)}}(.*?){{\/if}}/gs
        htmlBody = htmlBody.replace(conditionalRegex, (match: any, varName: any, content: any) => {
            return variables[varName] ? content : ''
        })

        // 4. Send via NotificationAPI with custom HTML
        const notificationPayload = {
            notificationId: 'custom_email', // Generic ID for custom emails
            user: {
                id: userId || to,
                email: to,
            },
            email: {
                subject: subject,
                html: htmlBody
            },
            // Optional: add mergeTags for additional personalization
            mergeTags: {
                ...variables,
                __template_key: templateKey
            }
        }

        const authString = btoa(`${NOTIFICATIONAPI_CLIENT_ID}:${NOTIFICATIONAPI_CLIENT_SECRET}`)

        const response = await fetch(`https://api.notificationapi.com/${NOTIFICATIONAPI_CLIENT_ID}/sender`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authString}`,
            },
            body: JSON.stringify(notificationPayload),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`NotificationAPI error (${response.status}): ${errorText}`)
        }

        const result = await response.json()
        console.log('[send-email] Success:', { to, templateKey, result })

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Email sent successfully',
                notificationId: result?.notificationId
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('[send-email] Error:', error)

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || String(error)
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
