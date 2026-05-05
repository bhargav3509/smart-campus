const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

// From address — use onboarding@resend.dev (Resend's shared domain) unless a custom domain is verified in Resend dashboard
const FROM_ADDRESS = process.env.EMAIL_FROM || 'Eve-Sphere <onboarding@resend.dev>';

// Startup check
if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️  RESEND_API_KEY not set — emails will be skipped');
} else {
  console.log('Email service ready! (Resend via HTTPS)');
}

// ── Helper to send any email ──
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
    if (error) {
      console.error('Failed to send email:', error.message);
    } else {
      console.log(`Email sent to ${to} (id: ${data?.id})`);
    }
  } catch (err) {
    console.error('Failed to send email:', err.message);
  }
};

// ── 1. Event Registration Confirmation ──
const sendRegistrationConfirmation = async (userEmail, userName, event) => {
  await sendEmail({
    to: userEmail,
    subject: `✅ Registration Confirmed — ${event.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
        <div style="background: #1d4ed8; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 22px;">EveSphere</h1>
        </div>
        <h2 style="color: #1f2937;">Hi ${userName}, you're registered! 🎉</h2>
        <p style="color: #6b7280;">Your registration for the following event has been confirmed:</p>
        <div style="background: white; border-left: 4px solid #1d4ed8; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="color: #1d4ed8; margin: 0 0 8px 0;">${event.title}</h3>
          <p style="color: #374151; margin: 4px 0;">📍 ${event.venue_name || 'TBA'}</p>
          <p style="color: #374151; margin: 4px 0;">📅 ${new Date(event.start_time).toLocaleString()}</p>
          <p style="color: #374151; margin: 4px 0;">🕐 Ends: ${new Date(event.end_time).toLocaleString()}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">See you there!</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">EveSphere Management Platform</p>
      </div>
    `,
  });
};

// ── 2. Booking Status Update ──
const sendBookingStatusEmail = async (userEmail, userName, booking, status) => {
  const isApproved = status === 'approved';
  await sendEmail({
    to: userEmail,
    subject: `${isApproved ? '✅' : '❌'} Venue Booking ${isApproved ? 'Approved' : 'Rejected'} — ${booking.venue_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
        <div style="background: #1d4ed8; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 22px;">EveSphere</h1>
        </div>
        <h2 style="color: #1f2937;">Hi ${userName}, your booking has been ${status}.</h2>
        <div style="background: white; border-left: 4px solid ${isApproved ? '#16a34a' : '#dc2626'}; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="color: ${isApproved ? '#16a34a' : '#dc2626'}; margin: 0 0 8px 0;">${booking.venue_name}</h3>
          <p style="color: #374151; margin: 4px 0;">📅 ${new Date(booking.start_time).toLocaleString()}</p>
          <p style="color: #374151; margin: 4px 0;">🕐 Until: ${new Date(booking.end_time).toLocaleString()}</p>
          <p style="color: #374151; margin: 4px 0;">Status: <strong style="color: ${isApproved ? '#16a34a' : '#dc2626'};">${status.toUpperCase()}</strong></p>
        </div>
        ${isApproved
          ? '<p style="color: #6b7280;">Your venue has been reserved. Please ensure the venue is left clean after use.</p>'
          : '<p style="color: #6b7280;">Unfortunately your booking request was not approved. Please try a different time slot or venue.</p>'
        }
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">EveSphere Management Platform</p>
      </div>
    `,
  });
};

// ── 3. Event Published Notification ──
const sendEventPublishedEmail = async (userEmail, userName, event) => {
  await sendEmail({
    to: userEmail,
    subject: `🎯 New Event Published — ${event.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
        <div style="background: #1d4ed8; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 22px;">EveSphere</h1>
        </div>
        <h2 style="color: #1f2937;">Hi ${userName}, a new event is available!</h2>
        <div style="background: white; border-left: 4px solid #7c3aed; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="color: #7c3aed; margin: 0 0 8px 0;">${event.title}</h3>
          <p style="color: #374151; margin: 4px 0;">${event.description || ''}</p>
          <p style="color: #374151; margin: 8px 0 4px 0;">📍 ${event.venue_name || 'TBA'}</p>
          <p style="color: #374151; margin: 4px 0;">📅 ${new Date(event.start_time).toLocaleString()}</p>
          <p style="color: #374151; margin: 4px 0;">👥 Max ${event.max_attendees} attendees</p>
        </div>
        <p style="color: #6b7280;">Log in to EveSphere to register for this event.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">EveSphere Management Platform</p>
      </div>
    `,
  });
};

// ── 4. Registration Cancellation ──
const sendRegistrationCancelledEmail = async (userEmail, userName, eventTitle) => {
  await sendEmail({
    to: userEmail,
    subject: `Registration Cancelled — ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
        <div style="background: #1d4ed8; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 22px;">EveSphere</h1>
        </div>
        <h2 style="color: #1f2937;">Hi ${userName},</h2>
        <p style="color: #6b7280;">Your registration for <strong>${eventTitle}</strong> has been cancelled.</p>
        <p style="color: #6b7280;">You can re-register anytime from your dashboard.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">EveSphere Management Platform</p>
      </div>
    `,
  });
};

// ── 5. Password Reset ──
const sendPasswordResetEmail = async (userEmail, userName, resetLink) => {
  await sendEmail({
    to: userEmail,
    subject: `🔐 Reset Your EveSphere Password`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
        <div style="background: #1d4ed8; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
          <h1 style="color: white; margin: 0; font-size: 22px;">EveSphere</h1>
        </div>
        <h2 style="color: #1f2937;">Hi ${userName},</h2>
        <p style="color: #6b7280;">We received a request to reset your password. Click the button below to set a new password.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="background: #1d4ed8; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #9ca3af; font-size: 13px;">This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">EveSphere Management Platform</p>
      </div>
    `,
  });
};

module.exports = {
  sendRegistrationConfirmation,
  sendBookingStatusEmail,
  sendEventPublishedEmail,
  sendRegistrationCancelledEmail,
  sendPasswordResetEmail,
};