import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly enabled: boolean;
  private readonly sesClient: SESClient | null;
  private readonly resendClient: Resend | null;
  private readonly emailProvider: 'resend' | 'ses' | 'none';

  constructor(private readonly configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'noreply@propertymarket.com';
    this.fromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'Property Market';
    this.enabled = this.configService.get<string>('EMAIL_ENABLED') !== 'false';

    // Initialize Resend client (works for all emails - verified and non-verified)
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    if (resendApiKey) {
      this.resendClient = new Resend(resendApiKey);
      this.emailProvider = 'resend';
      this.logger.log('[EMAIL] Resend client initialized - works for all emails (verified and non-verified)');
    } else {
      this.resendClient = null;
    }

    // Initialize AWS SES client as fallback if credentials are provided
    const awsRegion = this.configService.get<string>('AWS_REGION');
    const awsAccessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const awsSecretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (awsRegion && awsAccessKeyId && awsSecretAccessKey) {
      this.sesClient = new SESClient({
        region: awsRegion,
        credentials: {
          accessKeyId: awsAccessKeyId,
          secretAccessKey: awsSecretAccessKey,
        },
      });
      if (!this.resendClient) {
        this.emailProvider = 'ses';
        this.logger.log('[EMAIL] AWS SES client initialized (fallback mode)');
      } else {
        this.logger.log('[EMAIL] AWS SES client initialized (fallback)');
      }
    } else {
      this.sesClient = null;
      if (!this.resendClient) {
        this.emailProvider = 'none';
        this.logger.warn('[EMAIL] No email provider configured. Emails will be logged to console only.');
      }
    }
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(data: {
    to: string;
    userName: string;
    verificationLink: string;
    expiryHours: number;
  }): Promise<void> {
    if (!this.enabled) {
      this.logger.log(`[EMAIL DISABLED] Verification email would be sent to ${data.to}`);
      return;
    }

    const subject = 'Verify Your Email Address - Property Market';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px; border-radius: 8px;">
                <h1 style="color: #f97316; margin: 0 0 20px 0; font-size: 24px; font-weight: bold;">Verify Your Email Address</h1>
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hello ${data.userName},</p>
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Thank you for signing up with Property Market! To activate your account, please verify your email address.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${data.verificationLink}" style="display: inline-block; background-color: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Verify Email Address</a>
                </div>
                
                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0;">Or copy and paste this link in your browser:</p>
                <p style="color: #0066cc; font-size: 12px; word-break: break-all; margin: 10px 0 20px 0;">${data.verificationLink}</p>
                
                <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="color: #333333; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">⏱️ Important:</p>
                  <ul style="color: #333333; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li>This verification link expires in ${data.expiryHours} hours</li>
                    <li>Your account remains inactive until email verification is complete</li>
                    <li>You can request a new verification email if this one expires</li>
                  </ul>
                </div>
                
                <p style="color: #666666; font-size: 13px; margin: 20px 0 0 0;">If you didn't create this account, please ignore this email.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                  <p style="color: #666666; font-size: 12px; margin: 0;">Best regards,<br><strong style="color: #f97316;">The Property Market Team</strong></p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const plainText = `
Verify Your Email Address - Property Market

Hello ${data.userName},

Thank you for signing up with Property Market! To activate your account, please verify your email address.

Click here to verify: ${data.verificationLink}

Important:
- This verification link expires in ${data.expiryHours} hours
- Your account remains inactive until email verification is complete
- You can request a new verification email if this one expires

If you didn't create this account, please ignore this email.

Best regards,
The Property Market Team
    `;

    await this.sendEmail(data.to, subject, html);
  }

  /**
   * Send email
  async sendVerificationRequestSubmitted(email: string, providerName: string): Promise<void> {
    if (!this.enabled) {
      this.logger.log(`[EMAIL DISABLED] Verification request submitted email would be sent to ${email}`);
      return;
    }

    const subject = 'Verification Request Submitted - Property Market';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px; border-radius: 8px;">
                <h1 style="color: #f97316; margin: 0 0 20px 0; font-size: 24px; font-weight: bold;">Verification Request Submitted</h1>
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hello ${providerName},</p>
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">We've received your verification request. Our team will review your documents and get back to you within 1-3 business days.</p>
                
                <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="color: #333333; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">What happens next?</p>
                  <ul style="color: #333333; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Our team will review your submitted documents</li>
                    <li>You'll receive an email notification once the review is complete</li>
                    <li>If approved, your account will be verified automatically</li>
                  </ul>
                </div>
                
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">You can check your verification status anytime from your provider dashboard.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                  <p style="color: #666666; font-size: 14px; margin: 0;">Best regards,<br><strong style="color: #f97316;">The Property Market Team</strong></p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send verification approved email
   */
  async sendVerificationApproved(email: string, providerName: string): Promise<void> {
    if (!this.enabled) {
      this.logger.log(`[EMAIL DISABLED] Verification approved email would be sent to ${email}`);
      return;
    }

    const subject = 'Verification Approved - Property Market';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px; border-radius: 8px;">
                <div style="width: 80px; height: 80px; background-color: #22c55e; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 40px;">✓</span>
                </div>
                <h1 style="color: #22c55e; margin: 0 0 20px 0; font-size: 24px; font-weight: bold;">Verification Approved!</h1>
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hello ${providerName},</p>
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Great news! Your verification request has been approved.</p>
                
                <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="color: #333333; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">Your account is now verified! This means:</p>
                  <ul style="color: #333333; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Increased trust with clients</li>
                    <li>Access to all platform features</li>
                    <li>Verified badge on your profile</li>
                  </ul>
                </div>
                
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">You can now start receiving more job requests and grow your business on Property Market.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                  <p style="color: #666666; font-size: 14px; margin: 0;">Best regards,<br><strong style="color: #f97316;">The Property Market Team</strong></p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send verification rejected email
   */
  async sendVerificationRejected(
    email: string,
    providerName: string,
    rejectionReason: string,
  ): Promise<void> {
    if (!this.enabled) {
      this.logger.log(`[EMAIL DISABLED] Verification rejected email would be sent to ${email}`);
      return;
    }

    const subject = 'Verification Request Update - Property Market';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 20px 0; text-align: center; background-color: #ffffff;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px; border-radius: 8px;">
                <h1 style="color: #ef4444; margin: 0 0 20px 0; font-size: 24px; font-weight: bold;">Verification Request Update</h1>
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Hello ${providerName},</p>
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Unfortunately, your verification request could not be approved at this time.</p>
                
                <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="color: #333333; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">Reason:</p>
                  <p style="color: #991b1b; font-size: 15px; line-height: 1.6; margin: 0;">${rejectionReason}</p>
                </div>
                
                <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <p style="color: #333333; font-size: 16px; font-weight: bold; margin: 0 0 10px 0;">What can you do?</p>
                  <ul style="color: #333333; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Review the reason above and address the issues</li>
                    <li>Submit a new verification request with corrected documents</li>
                    <li>Contact support if you have questions</li>
                  </ul>
                </div>
                
                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0;">You can submit a new verification request from your provider dashboard.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                  <p style="color: #666666; font-size: 14px; margin: 0;">Best regards,<br><strong style="color: #f97316;">The Property Market Team</strong></p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await this.sendEmail(email, subject, html);
  }

  /**
   * Internal method to send email
   * Tries Resend first (works for all emails), falls back to AWS SES
   */
  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      if (!this.enabled) {
        this.logger.log(`[EMAIL DISABLED] Would send email to ${to}: ${subject}`);
        return;
      }

      // Convert HTML to plain text for better deliverability
      const plainText = html
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();

      // Try Resend first (works for all emails - verified and non-verified)
      if (this.resendClient) {
        try {
          // Use Resend's default domain for testing (doesn't require verification)
          // If EMAIL_FROM contains a custom domain, use onboarding@resend.dev instead
          let resendFromEmail = this.fromEmail;
          if (this.fromEmail.includes('@') && !this.fromEmail.includes('@resend.dev') && !this.fromEmail.includes('@gmail.com')) {
            // Custom domain detected - use Resend's default domain for testing
            resendFromEmail = 'onboarding@resend.dev';
            this.logger.log(`[EMAIL] Using Resend default domain (onboarding@resend.dev) for testing. To use custom domain, verify it at https://resend.com/domains`);
          }

          const { data, error } = await this.resendClient.emails.send({
            from: `${this.fromName} <${resendFromEmail}>`,
            to: [to],
            subject: subject,
            html: html,
            text: plainText,
            replyTo: resendFromEmail,
          });

          if (error) {
            throw error;
          }

          this.logger.log(`[EMAIL] Email sent successfully via Resend to ${to} (ID: ${data?.id})`);
          return;
        } catch (resendError: any) {
          this.logger.warn(`[EMAIL] Resend failed, trying AWS SES fallback: ${resendError?.message}`);
          // Fall through to AWS SES fallback
        }
      }

      // Fallback to AWS SES if configured
      if (this.sesClient) {
        try {
          const command = new SendEmailCommand({
            Source: `${this.fromName} <${this.fromEmail}>`,
            Destination: {
              ToAddresses: [to],
            },
            ReplyToAddresses: [this.fromEmail],
            Message: {
              Subject: {
                Data: subject,
                Charset: 'UTF-8',
              },
              Body: {
                Html: {
                  Data: html,
                  Charset: 'UTF-8',
                },
                Text: {
                  Data: plainText,
                  Charset: 'UTF-8',
                },
              },
            },
          });

          const response = await this.sesClient.send(command);
          this.logger.log(`[EMAIL] Email sent successfully via AWS SES to ${to} (MessageId: ${response.MessageId})`);
          return;
        } catch (sesError: any) {
          // Check if error is due to sandbox mode (unverified email)
          if (sesError?.name === 'MessageRejected' && sesError?.message?.includes('Email address is not verified')) {
            this.logger.warn(
              `[EMAIL] AWS SES rejected - recipient not verified in sandbox mode. ` +
              `Consider using Resend (works for all emails) or request AWS SES production access.`
            );
          } else {
            this.logger.error(`[EMAIL] AWS SES failed:`, sesError);
          }
          throw sesError; // Re-throw to trigger final fallback
        }
      }

      // Final fallback: Log to console (for development)
      this.logger.log(`[EMAIL] No email provider configured. Email would be sent to ${to}`);
      this.logger.log(`[EMAIL] Subject: ${subject}`);
      this.logger.debug(`[EMAIL] HTML: ${html.substring(0, 100)}...`);
    } catch (error: any) {
      this.logger.error(`[EMAIL] Failed to send email to ${to}:`, error);
      // Don't throw - email failures shouldn't break the main flow
    }
  }
}

