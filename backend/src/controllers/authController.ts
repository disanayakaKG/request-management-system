import { Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { db } from '../db/db';
import { config } from '../config/config';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendPasswordResetEmail, sendPasswordResetConfirmationEmail } from '../services/emailService';
import { User } from '../types';

export async function register(req: AuthenticatedRequest, res: Response) {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields (name, email, password) are required' });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  // Determine user role (Default is 'User' if not specified or invalid)
  let userRole: 'User' | 'Inventory Officer' | 'Admin' = 'User';
  if (role === 'Admin' || role === 'admin') {
    userRole = 'Admin';
  } else if (role === 'Inventory Officer' || role === 'Inventory' || role === 'inventory' || role === 'Officer') {
    userRole = 'Inventory Officer';
  } else if (role === 'User' || role === 'user' || role === 'Requester') {
    userRole = 'User';
  }

  try {
    const existing = db.findUserByEmail(trimmedEmail);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const salt = bcryptjs.genSaltSync(10);
    const passwordHash = bcryptjs.hashSync(password, salt);

    const newUser = db.createUser({
      name: name.trim(),
      email: trimmedEmail,
      password: passwordHash,
      role: userRole
    });

    // Create JWT
    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error during registration' });
  }
}

export async function login(req: AuthenticatedRequest, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = bcryptjs.compareSync(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error during login' });
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const user = db.findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    }
  });
}

/**
 * POST /api/auth/forgot-password
 * Initiates password reset by generating a 6-digit code and emailing the central recovery inbox
 */
export async function forgotPassword(req: AuthenticatedRequest, res: Response) {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'Email is required' });
  }

  const trimmedEmail = email.trim().toLowerCase();

  try {
    const user = db.findUserByEmail(trimmedEmail);

    if (user) {
      // Generate a 6-digit numeric reset token and token hash
      const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
      const tokenHash = createHash('sha256').update(resetToken).digest('hex');
      // Valid for 30 minutes
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      db.setResetToken(user.email, resetToken, tokenHash, expiresAt);

      // Audit Log
      db.createActivityLog({
        request_id: 'SYSTEM',
        action: 'PASSWORD_RESET_REQUESTED',
        performed_by: user.name,
        role: user.role,
        description: `Requested password reset link and code for account: ${user.email} (${user.role})`
      });

      // Dispatch password reset email to central recovery email (bwarehouseltl@gmail.com)
      try {
        await sendPasswordResetEmail(user, resetToken);
      } catch (err: any) {
        console.error('Failed to send password reset email:', err);
        return res.status(500).json({ message: 'Unable to send password reset email. Please try again later.' });
      }
    }

    return res.status(200).json({
      message: 'If an account exists for this email address, a password reset link and 6-digit code has been sent to the central password recovery email.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Unable to send password reset email. Please try again later.' });
  }
}

/**
 * POST /api/auth/reset-password
 * Resets user password using the 6-digit token or reset link
 */
export async function resetPassword(req: AuthenticatedRequest, res: Response) {
  const { email, token, newPassword, confirmPassword } = req.body;

  if (!email || !token || !newPassword) {
    return res.status(400).json({ message: 'Email, reset token, and new password are required' });
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'New password and confirmation password do not match' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long' });
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedToken = token.trim();
  const tokenHash = createHash('sha256').update(trimmedToken).digest('hex');

  try {
    const user = db.findUserByEmail(trimmedEmail);
    const isValidToken = user && (user.reset_token === trimmedToken || user.reset_token_hash === tokenHash || user.reset_token_hash === trimmedToken);

    if (!user || !isValidToken) {
      return res.status(400).json({ message: 'Invalid or expired password reset link/code' });
    }

    // Check expiration (30 minutes)
    if (user.reset_token_expires) {
      const expires = new Date(user.reset_token_expires).getTime();
      if (Date.now() > expires) {
        return res.status(400).json({ message: 'Password reset link/code has expired. Please request a new link.' });
      }
    }

    // Hash new password using bcrypt
    const newPasswordHash = bcryptjs.hashSync(newPassword, 10);

    // Update password in DB & Mongo and invalidate one-time token
    db.resetUserPassword(user.id, newPasswordHash);

    // Audit Log
    db.createActivityLog({
      request_id: 'SYSTEM',
      action: 'PASSWORD_RESET_COMPLETED',
      performed_by: user.name,
      role: user.role,
      description: `Successfully reset password for account: ${user.email} (${user.role})`
    });

    // Send confirmation email
    sendPasswordResetConfirmationEmail(user).catch(err => {
      console.error('Failed to send password reset confirmation email:', err);
    });

    return res.status(200).json({
      message: 'Password changed successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Internal server error during password reset' });
  }
}

/**
 * POST /api/auth/change-password
 * Allows an authenticated user to change their own password from profile settings
 */
export async function changePassword(req: AuthenticatedRequest, res: Response) {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Current password, new password, and confirmation password are required.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'New password and confirmation password do not match.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
  }

  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = db.findUserById(req.user.id);
    if (!user || !user.password) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    const isMatch = bcryptjs.compareSync(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const newPasswordHash = bcryptjs.hashSync(newPassword, 10);
    db.resetUserPassword(user.id, newPasswordHash);

    db.createActivityLog({
      request_id: 'SYSTEM',
      action: 'PASSWORD_CHANGED',
      performed_by: user.name,
      role: user.role,
      description: `Successfully changed account password via security settings for email: ${user.email}`
    });

    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Internal server error changing password' });
  }
}

/**
 * POST /api/auth/admin/reset-user-password
 * Allows an authorized Admin to reset another account's password
 */
export async function adminResetUserPassword(req: AuthenticatedRequest, res: Response) {
  const { userId, targetEmail, newPassword } = req.body;

  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ message: 'Access denied. Admin authorization required.' });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
  }

  try {
    let targetUser: User | undefined;
    if (userId) {
      targetUser = db.findUserById(userId);
    } else if (targetEmail) {
      targetUser = db.findUserByEmail(targetEmail.trim().toLowerCase());
    }

    if (!targetUser) {
      return res.status(404).json({ message: 'Target user account not found.' });
    }

    const newPasswordHash = bcryptjs.hashSync(newPassword, 10);
    db.resetUserPassword(targetUser.id, newPasswordHash);

    // Audit Log
    db.createActivityLog({
      request_id: 'SYSTEM',
      action: 'ADMIN_PASSWORD_RESET',
      performed_by: req.user.name,
      role: req.user.role,
      description: `Admin ${req.user.name} reset password for account: ${targetUser.email} (${targetUser.role})`
    });

    return res.status(200).json({
      message: `Successfully reset password for account ${targetUser.email}.`
    });
  } catch (error) {
    console.error('Admin reset user password error:', error);
    return res.status(500).json({ message: 'Internal server error during admin password reset' });
  }
}
