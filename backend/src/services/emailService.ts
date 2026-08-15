import { User, Request as RequestType } from '../types.js';
import {
  sendNewRequestNotifications,
  sendInventoryReviewedNotifications,
  sendAdminDecisionNotifications,
  sendWorkCompletedNotifications,
  sendPasswordResetEmail as sendResetEmail,
  sendPasswordResetSuccessEmail as sendResetSuccessEmail,
  verifySmtp,
  sendTestEmail
} from './email.js';

/**
 * Enterprise Email Service Facade
 * Provides high-level, production-ready functions for all SMTP notification workflows.
 */

/**
 * 1. Send Request Created Email
 * Notifies Requester (Confirmation), Inventory Officers (Action Needed), and Admins (Notification).
 */
export async function sendRequestCreatedEmail(
  user: { name: string; email: string },
  request: RequestType,
  adminEmails: string[],
  officerEmails: string[]
): Promise<void> {
  await sendNewRequestNotifications(user, request, officerEmails, adminEmails);
}

/**
 * 2. Send Inventory Manager Confirmation Email
 * Notifies User (Confirmation of IM review) and Admins (Action Required for Approval).
 */
export async function sendInventoryManagerConfirmationEmail(
  officerName: string,
  request: RequestType,
  adminEmails: string[],
  user: { name: string; email: string },
  materialsCount: number = 0,
  toolsCount: number = 0
): Promise<void> {
  await sendInventoryReviewedNotifications(officerName, request, adminEmails, user, materialsCount, toolsCount);
}

/**
 * 3. Send Admin Approval / Decision Email
 * Notifies User (Approved/Rejected status) and Inventory Officers (Proceed with work).
 */
export async function sendAdminApprovalEmail(
  adminName: string,
  request: RequestType,
  comments: string,
  user: { name: string; email: string },
  officerEmails: string[]
): Promise<void> {
  await sendAdminDecisionNotifications(adminName, request, comments, user, officerEmails);
}

/**
 * 4. Send Request Completed Email
 * Notifies Admins (Completion notice), Inventory Officers (Stock deducted alert), and User (Closed receipt).
 */
export async function sendRequestCompletedEmail(
  user: { name: string; email: string },
  request: RequestType,
  adminEmails: string[],
  officerEmails: string[]
): Promise<void> {
  await sendWorkCompletedNotifications(user, request, adminEmails, officerEmails);
}

/**
 * 5. Send Password Reset Email
 * Sends HTML email with a Reset Password button linking to frontend reset page and a security verification code.
 */
export async function sendPasswordResetEmail(user: User, token: string): Promise<any> {
  return sendResetEmail(user, token);
}

/**
 * 6. Send Password Reset Confirmation Email
 * Sends confirmation alert to user when password is successfully changed.
 */
export async function sendPasswordResetConfirmationEmail(user: User): Promise<any> {
  return sendResetSuccessEmail(user);
}

export { verifySmtp, sendTestEmail };
