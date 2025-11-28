import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import OTP from '../models/otpModel.js';
import { sendOTPEmail } from '../utils/emailService.js';
import crypto from 'crypto';


const loginUser = async (req, res) => {
  try {
    const { email, password, intendedRole } = req.body;

    if (!email || !password || !intendedRole) {
      return res.status(400).json({ message: 'Please provide email, password, and role.' });
    }

    // Normalize email and role to lowercase for consistent comparison
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedIntendedRole = intendedRole.toLowerCase().trim();

    // find the user by email
    const user = await User.findOne({ email: normalizedEmail });

    // check if the user exists.
    if (!user) {
      // User not found — tests expect this exact message to be displayed by the UI
      return res.status(401).json({ message: 'Account does not exist' });
    }

    // User exists, then check their password.
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // Wrong password — tests expect this exact message
      return res.status(401).json({ message: 'Incorrect password' });
    }
    // Password is correct. Now check if they are on the right portal.
    if (user.role.toLowerCase() !== normalizedIntendedRole) {
      return res.status(403).json({ // 403 Forbidden
        message: `This is a ${user.role} account. Please use the ${user.role} login portal.`,
      });
    }

    // all tests passed: User is valid AND on the correct portal.
    
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      committeeType: user.committeeType,
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong on our end' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields FIRST
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Please provide both current password and new password.' 
      });
    }

    // Strong password validation using Regex (only validate NEW password)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

     
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: 'Password is not strong enough. It must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.' 
      });
    }

    
    // req.user is attached by the 'protect' middleware
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if the current password is correct using the model's matchPassword method
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password.' });
    }


    // Check if new password is same as current password
    const isSamePassword = await user.matchPassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ 
        message: 'New password must be different from your current password.' 
      });
    }

    // Set new password - the pre-save hook in userModel will hash it automatically
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully.' });

  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ message: 'An unexpected server error occurred.' });
  }
};

const getUserProfile = async (req, res) => {
  res.status(200).json(req.user);
};

// Generate and send OTP for password reset
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide your email address.' });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Save new OTP
    const otpDoc = new OTP({
      email: email.toLowerCase(),
      otp: otp,
    });
    await otpDoc.save();

    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp);
    
    if (!emailResult.success) {
      return res.status(500).json({ 
        message: 'Failed to send OTP email. Please try again later.' 
      });
    }
    
    // For development - also log the OTP to console
    console.log(`OTP for ${email}: ${otp}`);

    res.status(200).json({
      message: 'OTP sent successfully to your email address. Please check your inbox.',
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Something went wrong on our end.' });
  }
};

// Verify OTP and reset password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        message: 'Please provide email, OTP, and new password.' 
      });
    }

    // Strong password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]).{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message:
          'Password is not strong enough. It must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
      });
    }

    // Find and verify OTP
    const otpDoc = await OTP.findOne({ 
      email: email.toLowerCase(), 
      otp: otp 
    });

    if (!otpDoc) {
      return res.status(400).json({ 
        message: 'Invalid or expired OTP. Please request a new one.' 
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if new password is same as current password
    const isSamePassword = await user.matchPassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ 
        message: 'New password cannot be the same as your current password. Please choose a different password.' 
      });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    // Delete the used OTP
    await OTP.deleteOne({ _id: otpDoc._id });

    res.status(200).json({
      message: 'Password reset successfully. You can now login with your new password.',
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Something went wrong on our end.' });
  }
};



// Admin-only: create a new student account
const registerStudent = async (req, res) => {
  try {
    // Only admins can create accounts
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail.endsWith('@dau.ac.in')) {
      return res.status(400).json({ message: 'Email must end with @dau.ac.in' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          'Password is not strong enough. It must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
      });
    }

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'student',
    });

    await user.save();

    res.status(201).json({ message: 'Student account created successfully.' });
  } catch (error) {
    console.error('registerStudent error:', error);
    res.status(500).json({ message: 'Failed to create student account.' });
  }
};

// Admin-only: create a new committee account
const registerCommittee = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail.endsWith('@dau.ac.in')) {
      return res.status(400).json({ message: 'Email must end with @dau.ac.in' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          'Password is not strong enough. It must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
      });
    }

    // Canonical committee keys (must match userModel enum / seed data)
    const registered = [
      'Canteen',
      'Hostel',
      'Sports',
      'Tech',
      'Academic',
      'Internal Complaints',
      'Annual Fest',
      'Cultural',
      'Placement',
      'Disciplinary Action',
      'Maintenance',
    ];

    const lowerName = name.toLowerCase();
    // Try to find a canonical key that matches the provided name (loose matching)
    let matched = registered.find((r) => {
      const rl = r.toLowerCase();
      return rl === lowerName || lowerName.includes(rl) || rl.includes(lowerName);
    });

    if (!matched) {
      // Try common display variants
      matched = registered.find((r) => {
        const rl = r.toLowerCase();
        // allow matching when provided name contains a key word like 'hostel' or 'tech'
        return rl.split(' ').some((part) => lowerName.includes(part));
      });
    }

    if (!matched) {
      return res.status(400).json({
        message: `Unknown committee name. Allowed committees: ${registered.join(', ')}`,
      });
    }

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'committee',
      committeeType: matched,
    });

    await user.save();

    res.status(201).json({ message: 'Committee account created successfully.' });
  } catch (error) {
    console.error('registerCommittee error:', error);
    res.status(500).json({ message: 'Failed to create committee account.' });
  }
};



// Admin-only: delete a user by email
const deleteUser = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { email, role } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Prevent deleting admin accounts via this endpoint
    const target = await User.findOne({ email: normalizedEmail });
    if (!target) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Validate that the selected role matches the target user's role
    if (role && target.role !== role) {
      return res.status(400).json({ message: `This is a ${target.role} account, not a ${role} account.` });
    }

    if (target.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin accounts.' });
    }

    // Prevent admin deleting themselves
    if (req.user.email && req.user.email.toLowerCase() === normalizedEmail) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    await User.deleteOne({ _id: target._id });

    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ message: 'Failed to delete user.' });
  }
};

export { loginUser, getUserProfile, changePassword, forgotPassword, resetPassword, registerStudent, registerCommittee, deleteUser };


