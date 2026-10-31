import nodemailer from 'nodemailer';

export const sendInquiryNotifications = async ({ customer, inquiry, requirement }) => {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.log(`[Email Notice] SMTP not configured. Notification simulated for inquiry #${inquiry.inquiryNumber} to ${customer.email}`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 1. Send confirmation to customer
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Special Tech <contact@specialtech.com>',
      to: customer.email,
      subject: `Project Proposal Received — #${inquiry.inquiryNumber} | Special Tech`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #087BFF; margin-top: 0; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">SPECIAL TECH</h2>
          <p>Dear ${customer.name},</p>
          <p>Thank you for submitting your project requirement to Special Tech. Our engineering architecture team has received your project specification and interactive prototype.</p>
          <div style="background: #f8fafc; padding: 16px; border-left: 4px solid #087BFF; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0 0 8px 0;"><strong>Inquiry Reference:</strong> ${inquiry.inquiryNumber}</p>
            <p style="margin: 0 0 8px 0;"><strong>Project Title:</strong> ${inquiry.title}</p>
            <p style="margin: 0;"><strong>Status:</strong> Under Architectural Review</p>
          </div>
          <p>A Senior Solutions Architect will reach out to you within 24 business hours to discuss timeline, exact scope, and kickoff steps.</p>
          <br/>
          <p style="color: #64748b; font-size: 13px; font-weight: 600;">SPECIAL TECH — Innovation • Intelligence • Solutions</p>
        </div>
      `,
    });

    console.log(`[Email Notice] Inquiry confirmation sent to ${customer.email}`);
  } catch (error) {
    console.warn('[Email Error] Failed to send email notification:', error.message);
  }
};
