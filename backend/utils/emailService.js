import nodemailer from 'nodemailer';

// Create transporter (configurable for Gmail or custom SMTP)
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email configuration incomplete. Email sending will be skipped.');
    return null;
  }

  const isGmail = process.env.EMAIL_USER.includes('@gmail.com');

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Custom SMTP
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const secure = process.env.SMTP_SECURE === 'true';

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send OTP email
export const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();
    if (!transporter) return { success: false, error: 'Email not configured' };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset OTP - Campus Complaint Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Password Reset Request</h2>
          <p>You have requested to reset your password for the Campus Complaint Management System.</p>
          <p>Your One-Time Password (OTP) is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1f2937; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p><strong>Important:</strong></p>
          <ul>
            <li>This OTP is valid for only <strong>5 minutes</strong></li>
            <li>Do not share this OTP with anyone</li>
            <li>If you didn't request this, please ignore this email</li>
          </ul>
          <p>Best regards,<br>Campus Complaint Resolve</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

export const sendStatusUpdateEmail = async (email, complaintTitle, status, description) => {
  try {
    const transporter = createTransporter();
    if (!transporter) return { success: false, error: 'Email not configured' };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Complaint Status Updated: ${complaintTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Complaint Status Update</h2>
          <p>Your complaint <strong>\"${complaintTitle}\"</strong> status has been updated to <strong>${status}</strong>.</p>
          <p><strong>Update details:</strong></p>
          <div style="background-color: #f3f4f6; padding: 14px; margin: 12px 0;">
            <p style="margin:0;">${description}</p>
          </div>
          <p>Best regards,<br/>Campus Complaint Resolve</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Status update email error:', error);
    return { success: false, error: error.message };
  }
};

export default { sendOTPEmail, sendStatusUpdateEmail };
