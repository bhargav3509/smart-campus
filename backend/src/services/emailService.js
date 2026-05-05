const { BrevoClient } = require('@getbrevo/brevo');
require('dotenv').config();

const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || 'evesphere028@gmail.com';
const FROM_NAME  = process.env.EMAIL_FROM_NAME    || 'EveSphere';

let client = null;

if (!process.env.BREVO_API_KEY) {
  console.warn('⚠️  BREVO_API_KEY not set — emails will be skipped');
} else {
  client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });
  console.log(`Email service ready! (Brevo — sending from ${FROM_EMAIL})`);
}

// ── Core send helper ──────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  if (!client) return;
  try {
    await client.transactionalEmails.sendTransacEmail({
      sender:      { name: FROM_NAME, email: FROM_EMAIL },
      to:          [{ email: to }],
      subject,
      htmlContent: html,
    });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Failed to send email:', err?.response?.body?.message || err.message);
  }
};

// ── 1. Registration Confirmation ──────────────────────────────────────────────
const sendRegistrationConfirmation = async (userEmail, userName, event) => {
  await sendEmail({
    to: userEmail,
    subject: `✅ Registration Confirmed — ${event.title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;">
        <div style="background:#1d4ed8;padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#fff;margin:0;font-size:22px;">EveSphere</h1>
        </div>
        <h2 style="color:#1f2937;">Hi ${userName}, you're registered! 🎉</h2>
        <p style="color:#6b7280;">Your registration for the following event has been confirmed:</p>
        <div style="background:#fff;border-left:4px solid #1d4ed8;padding:16px;border-radius:8px;margin:16px 0;">
          <h3 style="color:#1d4ed8;margin:0 0 8px 0;">${event.title}</h3>
          <p style="color:#374151;margin:4px 0;">📍 ${event.venue_name || 'TBA'}</p>
          <p style="color:#374151;margin:4px 0;">📅 ${new Date(event.start_time).toLocaleString()}</p>
          <p style="color:#374151;margin:4px 0;">🕐 Ends: ${new Date(event.end_time).toLocaleString()}</p>
        </div>
        <p style="color:#6b7280;font-size:14px;">See you there!</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
        <p style="color:#9ca3af;font-size:12px;text-align:center;">EveSphere Management Platform</p>
      </div>`,
  });
};

// ── 2. Booking Status Update ──────────────────────────────────────────────────
const sendBookingStatusEmail = async (userEmail, userName, booking, status) => {
  const ok = status === 'approved';
  await sendEmail({
    to: userEmail,
    subject: `${ok ? '✅' : '❌'} Venue Booking ${ok ? 'Approved' : 'Rejected'} — ${booking.venue_name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;">
        <div style="background:#1d4ed8;padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#fff;margin:0;font-size:22px;">EveSphere</h1>
        </div>
        <h2 style="color:#1f2937;">Hi ${userName}, your booking has been ${status}.</h2>
        <div style="background:#fff;border-left:4px solid ${ok ? '#16a34a' : '#dc2626'};padding:16px;border-radius:8px;margin:16px 0;">
          <h3 style="color:${ok ? '#16a34a' : '#dc2626'};margin:0 0 8px 0;">${booking.venue_name}</h3>
          <p style="color:#374151;margin:4px 0;">📅 ${new Date(booking.start_time).toLocaleString()}</p>
          <p style="color:#374151;margin:4px 0;">🕐 Until: ${new Date(booking.end_time).toLocaleString()}</p>
          <p style="color:#374151;margin:4px 0;">Status: <strong style="color:${ok ? '#16a34a' : '#dc2626'};">${status.toUpperCase()}</strong></p>
        </div>
        ${ok
          ? '<p style="color:#6b7280;">Your venue has been reserved. Please ensure it is left clean after use.</p>'
          : '<p style="color:#6b7280;">Unfortunately your request was not approved. Please try a different time slot or venue.</p>'}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
        <p style="color:#9ca3af;font-size:12px;text-align:center;">EveSphere Management Platform</p>
      </div>`,
  });
};

// ── 3. Event Published Notification ──────────────────────────────────────────
const sendEventPublishedEmail = async (userEmail, userName, event) => {
  await sendEmail({
    to: userEmail,
    subject: `🎯 New Event Published — ${event.title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;">
        <div style="background:#1d4ed8;padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#fff;margin:0;font-size:22px;">EveSphere</h1>
        </div>
        <h2 style="color:#1f2937;">Hi ${userName}, a new event is available!</h2>
        <div style="background:#fff;border-left:4px solid #7c3aed;padding:16px;border-radius:8px;margin:16px 0;">
          <h3 style="color:#7c3aed;margin:0 0 8px 0;">${event.title}</h3>
          <p style="color:#374151;margin:4px 0;">${event.description || ''}</p>
          <p style="color:#374151;margin:8px 0 4px 0;">📍 ${event.venue_name || 'TBA'}</p>
          <p style="color:#374151;margin:4px 0;">📅 ${new Date(event.start_time).toLocaleString()}</p>
          <p style="color:#374151;margin:4px 0;">👥 Max ${event.max_attendees} attendees</p>
        </div>
        <p style="color:#6b7280;">Log in to EveSphere to register for this event.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
        <p style="color:#9ca3af;font-size:12px;text-align:center;">EveSphere Management Platform</p>
      </div>`,
  });
};

// ── 4. Registration Cancellation ─────────────────────────────────────────────
const sendRegistrationCancelledEmail = async (userEmail, userName, eventTitle) => {
  await sendEmail({
    to: userEmail,
    subject: `Registration Cancelled — ${eventTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;">
        <div style="background:#1d4ed8;padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#fff;margin:0;font-size:22px;">EveSphere</h1>
        </div>
        <h2 style="color:#1f2937;">Hi ${userName},</h2>
        <p style="color:#6b7280;">Your registration for <strong>${eventTitle}</strong> has been cancelled.</p>
        <p style="color:#6b7280;">You can re-register anytime from your dashboard.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
        <p style="color:#9ca3af;font-size:12px;text-align:center;">EveSphere Management Platform</p>
      </div>`,
  });
};

// ── 5. Password Reset ─────────────────────────────────────────────────────────
const sendPasswordResetEmail = async (userEmail, userName, resetLink) => {
  await sendEmail({
    to: userEmail,
    subject: `🔐 Reset Your EveSphere Password`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;">
        <div style="background:#1d4ed8;padding:20px;border-radius:8px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#fff;margin:0;font-size:22px;">EveSphere</h1>
        </div>
        <h2 style="color:#1f2937;">Hi ${userName},</h2>
        <p style="color:#6b7280;">We received a request to reset your password. Click the button below to set a new password.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${resetLink}" style="background:#1d4ed8;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;">Reset Password</a>
        </div>
        <p style="color:#9ca3af;font-size:13px;">This link expires in <strong>1 hour</strong>. If you didn't request a reset, ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
        <p style="color:#9ca3af;font-size:12px;text-align:center;">EveSphere Management Platform</p>
      </div>`,
  });
};

module.exports = {
  sendRegistrationConfirmation,
  sendBookingStatusEmail,
  sendEventPublishedEmail,
  sendRegistrationCancelledEmail,
  sendPasswordResetEmail,
};