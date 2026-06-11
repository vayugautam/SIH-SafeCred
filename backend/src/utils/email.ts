// Simpler email utilities to avoid complex nested template literals which
// caused TypeScript parsing issues. These templates are functional and
// suitable for development; they can be replaced with richer HTML later.

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'SafeCred <noreply@safecred.com>';

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  // In CI/development we simply log the email. If RESEND_API_KEY is provided
  // the implementation can be extended to call an external provider.
  console.log('[Email] To:', to);
  console.log('[Email] Subject:', subject);
  console.log('[Email] Body length:', html.length);
  return { success: true, mode: 'development' };
}

export function welcomeEmail(name: string) {
  return {
    subject: 'Welcome to SafeCred - Your Account is Ready!',
    html: `<p>Hi ${name},</p><p>Welcome to SafeCred — your account is ready.</p>`
  };
}

export function applicationSubmittedEmail(name: string, applicationId: string, loanAmount: number) {
  return {
    subject: 'Loan Application Received - SafeCred',
    html: `<p>Hi ${name},</p><p>Your application ${applicationId} for ₹${loanAmount.toLocaleString()} has been received and is under review.</p>`
  };
}

export function applicationStatusEmail(name: string, applicationId: string, status: string, riskScore?: number) {
  return {
    subject: `Application ${status} - SafeCred`,
    html: `<p>Hi ${name},</p><p>Your application ${applicationId} status is <strong>${status}</strong>${riskScore ? ` with risk score ${riskScore}` : ''}.</p>`
  };
}

export function adminNotificationEmail(applicationId: string, applicantName: string, loanAmount: number, riskScore: number) {
  return {
    subject: `New Loan Application Requires Review - ${applicationId}`,
    html: `<p>Admin — application ${applicationId} by ${applicantName} for ₹${loanAmount.toLocaleString()} requires review. Risk score: ${riskScore}%</p>`
  };
}
