import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { EmailValidationService } from './email-validation.service';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailVerificationService {
  private readonly verificationTokenExpiryMs = 24 * 60 * 60 * 1000; // 24 hours
  private readonly maxVerificationAttempts = 5;

  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private emailValidationService: EmailValidationService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  /**
   * Send verification email to new user
   */
  async sendVerificationEmail(user: User): Promise<void> {
    try {
      // Check if already verified
      if (user.isEmailVerified) {
        throw new BadRequestException('Email is already verified');
      }

      // Generate verification token
      const verificationToken = this.emailValidationService.generateVerificationToken();
      const expiresAt = new Date(Date.now() + this.verificationTokenExpiryMs);

      // Save token to user
      await this.userRepository.update(user.id, {
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpires: expiresAt,
        emailVerificationAttempts: 0,
      });

      // Build verification link
      const appUrl = this.configService.get('APP_URL', 'http://localhost:3002');
      const verificationLink = `${appUrl}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;

      // Send email
      await this.emailService.sendVerificationEmail({
        to: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        verificationLink,
        expiryHours: 24,
      });
    } catch (error) {
      console.error('[EMAIL_VERIFICATION] Failed to send verification email:', error);
      throw new BadRequestException('Failed to send verification email. Please try again later.');
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Check if user has exceeded max attempts
    if (user.emailVerificationAttempts >= this.maxVerificationAttempts) {
      throw new BadRequestException(
        'Too many verification attempts. Please contact support.',
      );
    }

    await this.sendVerificationEmail(user);
  }

  /**
   * Verify email with token
   */
  async verifyEmailWithToken(token: string, email: string): Promise<User> {
    // Validate email format
    this.emailValidationService.validateEmailOrThrow(email);

    // Find user
    const user = await this.userRepository.findOne({
      where: {
        email,
        emailVerificationToken: token,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token or email');
    }

    // Check if already verified
    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Check if token expired
    if (!user.emailVerificationTokenExpires || user.emailVerificationTokenExpires < new Date()) {
      throw new BadRequestException(
        'Verification token has expired. Please request a new verification email.',
      );
    }

    // Check max attempts
    if (user.emailVerificationAttempts >= this.maxVerificationAttempts) {
      throw new BadRequestException(
        'Too many failed verification attempts. Please contact support or request a new verification email.',
      );
    }

    // Verify email
    const verifiedUser = await this.userRepository.save({
      ...user,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationTokenExpires: null,
      emailVerificationAttempts: 0,
    });

    return verifiedUser;
  }

  /**
   * Increment failed verification attempts
   */
  async incrementVerificationAttempts(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return;
    }

    await this.userRepository.update(user.id, {
      emailVerificationAttempts: user.emailVerificationAttempts + 1,
    });
  }

  /**
   * Check if user's email is verified
   */
  async isEmailVerified(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return user?.isEmailVerified ?? false;
  }

  /**
   * Get email verification status
   */
  async getEmailVerificationStatus(
    userId: string,
  ): Promise<{ verified: boolean; lastSentAt?: Date; nextResendAvailable?: Date }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      verified: user.isEmailVerified,
      lastSentAt: user.emailVerificationTokenExpires
        ? new Date(user.emailVerificationTokenExpires.getTime() - this.verificationTokenExpiryMs)
        : undefined,
      nextResendAvailable: !user.isEmailVerified && user.emailVerificationTokenExpires 
        ? user.emailVerificationTokenExpires 
        : undefined,
    };
  }
}
