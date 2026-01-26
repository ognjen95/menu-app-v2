import formData from 'form-data'
import Mailgun from 'mailgun.js'

const mailgun = new Mailgun(formData)

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || ''
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || ''
const MAILGUN_API_URL = process.env.MAILGUN_API_URL || 'https://api.mailgun.net'
const FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL || `noreply@${MAILGUN_DOMAIN}`
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const mg = mailgun.client({
  username: 'api',
  key: MAILGUN_API_KEY,
  url: MAILGUN_API_URL,
})

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
    console.warn('Mailgun not configured. Email would be sent to:', to)
    console.warn('Subject:', subject)
    console.warn('HTML:', html)
    return { success: false, error: 'Mailgun not configured' }
  }

  try {
    console.log('Sending email via Mailgun...')
    console.log('Domain:', MAILGUN_DOMAIN)
    console.log('API URL:', MAILGUN_API_URL)
    console.log('From:', FROM_EMAIL)
    console.log('To:', to)
    console.log('API Key length:', MAILGUN_API_KEY.length)
    console.log('API Key starts with:', MAILGUN_API_KEY.substring(0, 10) + '...')

    const result = await mg.messages.create(MAILGUN_DOMAIN, {
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
    })

    console.log('Email sent successfully:', result.id)
    return { success: true, messageId: result.id }
  } catch (error: any) {
    console.error('Failed to send email:', error)
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
      details: error?.details,
    })
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      status: error?.status 
    }
  }
}

export async function sendTeamInvitation({
  to,
  tenantName,
  inviterName,
  role,
  token,
}: {
  to: string
  tenantName: string
  inviterName: string
  role: string
  token: string
}) {
  const inviteUrl = `${APP_URL}/invite/${token}`
  
  const subject = `You've been invited to join ${tenantName}`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Team Invitation</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Team Invitation</h1>
        </div>
        
        <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hi there,</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            <strong>${inviterName}</strong> has invited you to join <strong>${tenantName}</strong> as a <strong>${role}</strong>.
          </p>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            Click the button below to accept the invitation and set up your account:
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${inviteUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              Accept Invitation
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            Or copy and paste this link into your browser:
          </p>
          <p style="font-size: 14px; color: #667eea; word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 6px;">
            ${inviteUrl}
          </p>
          
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
            This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} QR Menu. All rights reserved.</p>
        </div>
      </body>
    </html>
  `

  return sendEmail({ to, subject, html })
}
