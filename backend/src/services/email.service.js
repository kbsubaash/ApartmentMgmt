const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });
  }
  return transporter;
};

const ASSOCIATION_NAME = 'DABC Euphorbia Phase 3 Apartment Owners Welfare Association';

const sendEmail = async ({ to, subject, html }) => {
  if (!env.smtpHost || !env.smtpUser) {
    // Email not configured â€” log and skip silently
    console.warn('Email not configured. Skipping email to:', to);
    return;
  }
  try {
    await getTransporter().sendMail({
      from: `"${ASSOCIATION_NAME}" <${env.smtpFrom}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Email send error:', err.message);
    // Non-fatal â€” do not throw
  }
};

const sendCircularPublishedEmail = async ({ to, name, title, circularId }) => {
  const link = `${env.clientOrigin}/circulars/${circularId}`;
  await sendEmail({
    to,
    subject: `New Circular: ${title}`,
    html: `
      <p>Dear ${name},</p>
      <p>A new circular has been published by <strong>${ASSOCIATION_NAME}</strong>:</p>
      <h3>${title}</h3>
      <p><a href="${link}">Click here to read the circular</a></p>
      <hr/>
      <small>${ASSOCIATION_NAME}</small>
    `,
  });
};

const sendComplaintStatusEmail = async ({ to, name, complaintTitle, status, complaintId }) => {
  const link = `${env.clientOrigin}/complaints/${complaintId}`;
  await sendEmail({
    to,
    subject: `Complaint Update: ${complaintTitle}`,
    html: `
      <p>Dear ${name},</p>
      <p>Your complaint <strong>"${complaintTitle}"</strong> has been updated.</p>
      <p><strong>New Status:</strong> ${status}</p>
      <p><a href="${link}">View complaint details</a></p>
      <hr/>
      <small>${ASSOCIATION_NAME}</small>
    `,
  });
};

const sendMaintenanceReminderEmail = async ({ to, name, month, amount, notes }) => {
  await sendEmail({
    to,
    subject: `Maintenance Payment Reminder — ${month}`,
    html: `
      <p>Dear ${name},</p>
      <p>This is a friendly reminder from <strong>${ASSOCIATION_NAME}</strong> regarding your maintenance payment.</p>
      <table style="border-collapse:collapse; margin: 16px 0;">
        <tr><td style="padding:4px 16px 4px 0; color:#555;">Month</td><td style="padding:4px 0;"><strong>${month}</strong></td></tr>
        ${amount ? `<tr><td style="padding:4px 16px 4px 0; color:#555;">Amount Due</td><td style="padding:4px 0;"><strong>₹${amount}</strong></td></tr>` : ''}
      </table>
      ${notes ? `<p style="color:#333;">${notes}</p>` : ''}
      <p>Please make the payment at the earliest to avoid any inconvenience.</p>
      <p>If you have already made the payment, please ignore this reminder.</p>
      <hr/>
      <small>${ASSOCIATION_NAME}</small>
    `,
  });
};

module.exports = { sendEmail, sendCircularPublishedEmail, sendComplaintStatusEmail, sendMaintenanceReminderEmail };
