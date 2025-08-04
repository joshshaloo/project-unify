import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// Create reusable transporter based on environment
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production: Use SendGrid, Resend, or other service
    return nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST || 'smtp.sendgrid.net',
      port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })
  } else {
    // Development/Preview: Use MailHog or similar
    return nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST || 'localhost',
      port: parseInt(process.env.EMAIL_SERVER_PORT || '1025'),
      secure: false,
      ignoreTLS: true,
    })
  }
}

export async function sendEmail(options: EmailOptions) {
  const transporter = createTransporter()
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@soccer-unify.com',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent:', info.messageId)
    return info
  } catch (error) {
    console.error('Email send error:', error)
    
    // In development, if MailHog is not running, log the email content instead
    if (process.env.NODE_ENV === 'development') {
      console.log('=== SIMULATED EMAIL (MailHog not available) ===')
      console.log('To:', options.to)
      console.log('Subject:', options.subject)
      console.log('HTML:', options.html)
      console.log('================================================')
      // Return a mock response to prevent upstream failures
      return { messageId: 'mock-dev-message-id' }
    }
    
    throw error
  }
}