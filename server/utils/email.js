import nodemailer from "nodemailer";

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function getBaseTemplate(title, content) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #333; text-align: center;">${title}</h2>
      ${content}
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0 20px 0;" />
      <p style="color: #999; font-size: 12px; text-align: center;">&copy; ${new Date().getFullYear()} InfluBrand. All rights reserved.</p>
    </div>
  `;
}

export async function sendOtpEmail(toEmail, otpCode) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[DEV MODE] SMTP not configured. OTP for ${toEmail} is ${otpCode}`);
    return;
  }

  const content = `
    <p style="color: #555; font-size: 16px;">Hello,</p>
    <p style="color: #555; font-size: 16px;">Your verification code is:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #10b981; padding: 10px 20px; background-color: #f0fdf4; border-radius: 8px;">${otpCode}</span>
    </div>
    <p style="color: #555; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"InfluBrand" <noreply@influbrand.com>',
    to: toEmail,
    subject: "Your InfluBrand Verification Code",
    html: getBaseTemplate("InfluBrand Verification", content),
  });
}

export async function sendNewMessageEmail(toEmail, senderName, subject) {
  const transporter = getTransporter();
  if (!transporter) return;

  const content = `
    <p style="color: #555; font-size: 16px;">Hello,</p>
    <p style="color: #555; font-size: 16px;">You have received a new message from <strong>${senderName}</strong> on InfluBrand.</p>
    <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0; color: #374151; font-weight: bold;">Subject: ${subject}</p>
    </div>
    <p style="color: #555; font-size: 14px;">Please log in to your dashboard to view and reply to this message.</p>
    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.CLIENT_ORIGIN?.split(',')[0]}/dashboard/messages" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Inbox</a>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"InfluBrand" <noreply@influbrand.com>',
    to: toEmail,
    subject: `New Message: ${subject}`,
    html: getBaseTemplate("New Message Received", content),
  });
}

export async function sendAccountApprovedEmail(toEmail, name) {
  const transporter = getTransporter();
  if (!transporter) return;

  const content = `
    <p style="color: #555; font-size: 16px;">Congratulations ${name},</p>
    <p style="color: #555; font-size: 16px;">Your InfluBrand profile has been reviewed and officially <strong>Approved!</strong> 🎉</p>
    <p style="color: #555; font-size: 16px;">Your profile will now display the verified checkmark, and you are fully visible to brands on the marketplace.</p>
    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.CLIENT_ORIGIN?.split(',')[0]}/dashboard/public-profile" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Your Profile</a>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"InfluBrand" <noreply@influbrand.com>',
    to: toEmail,
    subject: "Your Profile is Approved!",
    html: getBaseTemplate("Account Verified", content),
  });
}

export async function sendPurchaseReceiptEmail(toEmail, packageName, connects, amountInr) {
  const transporter = getTransporter();
  if (!transporter) return;

  const content = `
    <p style="color: #555; font-size: 16px;">Hello,</p>
    <p style="color: #555; font-size: 16px;">Thank you for your purchase. We have successfully added <strong>${connects} connects</strong> to your account.</p>
    <div style="margin: 20px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #111827;">Receipt Details</h3>
      <table style="width: 100%; font-size: 14px; color: #374151;">
        <tr>
          <td style="padding: 8px 0;"><strong>Package:</strong></td>
          <td style="text-align: right;">${packageName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Connects:</strong></td>
          <td style="text-align: right;">${connects}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; margin-top: 8px;"><strong>Total Paid:</strong></td>
          <td style="text-align: right; border-top: 1px solid #e5e7eb; margin-top: 8px; font-weight: bold;">₹${amountInr}</td>
        </tr>
      </table>
    </div>
    <p style="color: #555; font-size: 14px;">You can now use your connects to unlock influencer contact details.</p>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"InfluBrand" <noreply@influbrand.com>',
    to: toEmail,
    subject: "InfluBrand Purchase Receipt",
    html: getBaseTemplate("Payment Successful", content),
  });
}
