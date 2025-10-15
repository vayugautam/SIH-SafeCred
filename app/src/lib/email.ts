// Email service using Resend (can be swapped with SendGrid, Nodemailer, etc.)

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'SafeCred <noreply@safecred.com>'

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  try {
    // If using Resend
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: from || FROM_EMAIL,
          to: [to],
          subject,
          html
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send email')
      }

      return await response.json()
    }

    // Fallback: Log to console in development
    console.log('📧 Email (Development Mode):')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('Body:', html)
    
    return { success: true, mode: 'development' }

  } catch (error) {
    console.error('Email send error:', error)
    throw error
  }
}

// Email Templates

export function welcomeEmail(name: string, email: string) {
  return {
    subject: 'Welcome to SafeCred - Your Account is Ready!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to SafeCred!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Thank you for registering with SafeCred! Your account has been successfully created.</p>
            <p>We're excited to help you access fair and transparent credit scoring for your financial needs.</p>
            
            <h3>What's Next?</h3>
            <ul>
              <li>Complete your profile with accurate information</li>
              <li>Upload supporting documents (bank statements, bills, etc.)</li>
              <li>Apply for your first loan assessment</li>
              <li>Get instant risk scoring using our advanced ML algorithms</li>
            </ul>

            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" class="button">
              Go to Dashboard
            </a>

            <p>If you have any questions, feel free to contact our support team.</p>
            <p>Best regards,<br>The SafeCred Team</p>
          </div>
          <div class="footer">
            <p>© 2025 SafeCred. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

export function applicationSubmittedEmail(name: string, applicationId: string, loanAmount: number) {
  return {
    subject: 'Loan Application Received - SafeCred',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Application Received!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>We've successfully received your loan application and it's currently being processed.</p>
            
            <div class="info-box">
              <strong>Application Details:</strong><br>
              Application ID: <strong>${applicationId}</strong><br>
              Loan Amount: <strong>₹${loanAmount.toLocaleString()}</strong><br>
              Status: <strong>Under Review</strong>
            </div>

            <p>Our advanced ML-powered risk assessment system is analyzing your application. You'll receive updates as your application progresses through our review process.</p>

            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" class="button">
              Track Application
            </a>

            <p><strong>What happens next?</strong></p>
            <ol>
              <li>Automated risk scoring (instant)</li>
              <li>Admin review and verification (1-2 business days)</li>
              <li>Final decision notification</li>
            </ol>

            <p>Best regards,<br>The SafeCred Team</p>
          </div>
          <div class="footer">
            <p>© 2025 SafeCred. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

export function applicationStatusEmail(
  name: string, 
  applicationId: string, 
  status: string, 
  riskScore?: number
) {
  const statusColors = {
    approved: '#10b981',
    rejected: '#ef4444',
    pending: '#f59e0b'
  }

  const statusMessages = {
    approved: 'Congratulations! Your loan application has been approved.',
    rejected: 'Unfortunately, your loan application has been rejected.',
    pending: 'Your loan application is currently under review.'
  }

  return {
    subject: `Loan Application ${status.charAt(0).toUpperCase() + status.slice(1)} - SafeCred`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${statusColors[status as keyof typeof statusColors] || '#667eea'}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .status-box { background: white; padding: 20px; border-left: 4px solid ${statusColors[status as keyof typeof statusColors] || '#667eea'}; margin: 20px 0; text-align: center; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Application Status Update</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>${statusMessages[status as keyof typeof statusMessages] || 'Your application status has been updated.'}</p>
            
            <div class="status-box">
              <h3>Application ID: ${applicationId}</h3>
              <p style="font-size: 24px; font-weight: bold; color: ${statusColors[status as keyof typeof statusColors] || '#667eea'}; margin: 10px 0;">
                ${status.toUpperCase()}
              </p>
              ${riskScore ? `<p>Risk Score: <strong>${riskScore}%</strong></p>` : ''}
            </div>

            ${status === 'approved' ? `
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Review your loan terms and conditions</li>
                <li>Complete any remaining documentation</li>
                <li>Loan disbursement will be processed within 2-3 business days</li>
              </ul>
            ` : status === 'rejected' ? `
              <p>We understand this may be disappointing. Here are some tips to improve your future applications:</p>
              <ul>
                <li>Maintain regular income and payment patterns</li>
                <li>Keep your financial records up to date</li>
                <li>You can reapply after 30 days</li>
              </ul>
            ` : ''}

            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" class="button">
              View Dashboard
            </a>

            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>The SafeCred Team</p>
          </div>
          <div class="footer">
            <p>© 2025 SafeCred. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}

export function adminNotificationEmail(
  applicationId: string,
  applicantName: string,
  loanAmount: number,
  riskScore: number
) {
  return {
    subject: `New Loan Application Requires Review - ${applicationId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .risk-score { font-size: 32px; font-weight: bold; color: ${riskScore > 70 ? '#ef4444' : riskScore > 40 ? '#f59e0b' : '#10b981'}; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ New Application Alert</h1>
          </div>
          <div class="content">
            <h2>Admin Action Required</h2>
            <p>A new loan application has been submitted and requires your review.</p>
            
            <div class="details">
              <strong>Applicant:</strong> ${applicantName}<br>
              <strong>Application ID:</strong> ${applicationId}<br>
              <strong>Loan Amount:</strong> ₹${loanAmount.toLocaleString()}<br>
              <strong>ML Risk Score:</strong> <span class="risk-score">${riskScore}%</span>
            </div>

            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/applications" class="button">
              Review Application
            </a>

            <p><em>This is an automated notification from SafeCred Admin System.</em></p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}
