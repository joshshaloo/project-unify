import nodemailer from 'nodemailer'

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || 'localhost',
  port: parseInt(process.env.EMAIL_SERVER_PORT || '1025'),
  secure: false, // true for 465, false for other ports
  auth: process.env.EMAIL_SERVER_USER ? {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  } : undefined,
})

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@soccer.local',
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ''), // Strip HTML for text version
      html,
    })

    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email send error:', error)
    throw new Error('Failed to send email')
  }
}