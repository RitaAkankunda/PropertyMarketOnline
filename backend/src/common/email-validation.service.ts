import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class EmailValidationService {
  // Comprehensive list of disposable email providers
  private readonly disposableDomains = new Set([
    // Temporary email services
    'mailinator.com',
    'temp-mail.org',
    'tempmail.com',
    '10minutemail.com',
    '10minuteemail.com',
    'guerrillamail.com',
    'yopmail.com',
    'throwaway.email',
    'tempEmail.com',
    'maildrop.cc',
    'fakeinbox.com',
    'trashmail.com',
    'spamgourmet.com',
    'mytrashmail.com',
    'dispostable.com',
    'temp-mail.io',
    'mailnesia.com',
    'mintemail.com',
    'minute-mail.org',
    'temp-mail.cc',
    'mail1.in',
    'moakt.com',
    'temp-mail.live',
    'email.ms',
    'emailondeck.com',
    'trashmail.ws',
    'sharklasers.com',
    'spam4.me',
    'test.mail.tm',
    'tmailo.com',
    'temp-mails.com',
    'cashmail.ru',
    'spam-mail.ru',
    '0-mail.com',
    'binkmail.com',
    'bobmail.info',
    'coolmailbox.de',
    'dontreplytome.de',
    'dropmail.me',
    'fakeinbox.net',
    'grr.la',
    'guerrillamail.info',
    'guerrillamail.net',
    'guerrillamail.org',
    'gustr.com',
    'harakirimail.com',
    'hashemailed.com',
    'imails.info',
    'incognitomail.com',
    'isnotspam.com',
    'jetable.fr',
    'jetable.org',
    'kasmail.com',
    'killmail.net',
    'kingsds.de',
    'letterhead.info',
    'mailexpire.com',
    'mailfreeonline.com',
    'mailgarant.com',
    'mailguard.me',
    'mailismagic.com',
    'mailjunk.cf',
    'mailletemp.com',
    'mailmask.com',
    'mailnesia.com',
    'mailnull.com',
    'mailnuke.com',
    'mailorg.org',
    'mailpeio.com',
    'mailpile.com',
    'mailrock.biz',
    'mailsac.com',
    'mailscrap.com',
    'mailsforce.com',
    'mailsharks.com',
    'mailshell.com',
    'mailslurp.com',
    'mailstash.com',
    'mailtester.com',
    'mailthis.com',
    'mailtje.nl',
    'mailtrash.net',
    'mailwak.com',
    'mailwaring.com',
    'mailwarts.com',
    'mailwasher.net',
    'mailwhirl.com',
    'mailwithemail.com',
    'mailwithoutrules.com',
    'mailwrap.com',
    'mailxu.com',
    'mailz.ru',
    'mailzilla.org',
    'mailzilly.com',
    'mailzone.ru',
    'mark.zz.mu',
    'marmottin.fr',
    'mastah.web.id',
    'masteddd.com',
    'mat.tt',
    'matecha.com',
    'mauka.ru',
    'maxbuz.com',
    'maxmailing.net',
    'maxwreck.com',
    'mbox.re',
    'mboxrd.info',
    'mcheck.io',
    'megamaildrop.com',
    'meinmail.com',
    'mejl.se',
    'meldmail.com',
    'memeil.com',
    'memex.de',
    'memo.pl',
    'memogmail.com',
    'memorymail.com',
    'meowmail.com',
    'mephomail.com',
    'meqush.com',
    'mericsson.com',
    'meritmail.com',
    'mesmail.com',
    'messagingengine.com',
    'messaged.com',
    'messagesafe.com',
    'metahost.nl',
    'metaomni.info',
    'metapost.com',
    'metarail.ru',
    'metasb.com',
    'metaself.de',
    'metaspam.ru',
    'metatag.info',
    'metauniversity.ru',
    'metaxo.ru',
    'metazmail.com',
    'meteor-x.de',
    'meteomail.de',
    'meteomail.fr',
    'methmail.com',
    'methylsulfonylmethane.net',
    'metix.de',
    'metmail.ru',
    'metp.net',
    'metraid.de',
    'metrek.ru',
    'metrolog.de',
    'metromails.com',
    'metronmail.com',
    'metscapemail.com',
    'metsdance.com',
    'mexail.ru',
    'mexonline.de',
    'mexxicare.de',
    'meymail.ru',
    'meze.de',
    'mezmail.ru',
    'mfox.info',
    'mgt1.com',
    'mgtfm.de',
    'mgvtb.de',
    'mhacom.de',
    'mhammail.ru',
    'mhamsterdam.nl',
    'mhansard.de',
    'mharold.de',
    'mhat.ru',
    'mhatmail.ru',
    'mhbxf.de',
    'mhcall.de',
    'mhealth.de',
    'mhealth.ru',
    'mhealthcare.de',
    'mhealthcare.ru',
    'mhealthmail.de',
    'mhealthmail.ru',
    'mheartbeat.de',
    'mheartbeat.ru',
    'mhearts.ru',
    'mheavymail.ru',
    'mheavyweightmail.de',
    'mhelenamail.ru',
    'mhelenna.de',
    'mhelixmail.de',
    'mhelixmail.ru',
    'mhelp.de',
    'mhelp.ru',
    'mhelpdesk.de',
    'mhelpdesk.ru',
    'mhelpful.de',
    'mhelpful.ru',
    'mhelsinki.de',
    'mhelsinki.ru',
    'mhelsinki-mail.com',
    'mhem.ru',
    'mhema.de',
    'mhemarketplace.ru',
    'mhemail.ru',
    'mhembed.de',
    'mhembed.ru',
    'mhemic.de',
    'mhemic.ru',
    'mhempire.de',
    'mhempire.ru',
    'mhenclosed.de',
    'mhenclosed.ru',
    'mhencrypted.de',
    'mhencrypted.ru',
    'mhendr.com',
    'mhendrix.de',
    'mhendrix.ru',
    'mhengine.de',
    'mhengine.ru',
    'mhenhance.de',
    'mhenhance.ru',
    'mhenior.de',
    'mhenior.ru',
    'mhenlight.de',
    'mhenlight.ru',
    'mhenliven.de',
    'mhenliven.ru',
    'mhennedy.de',
    'mhennedy.ru',
    'mhennessee.de',
    'mhennessee.ru',
    'mhennestad.de',
    'mhennestad.ru',
    'mhenning.de',
    'mhenning.ru',
    'mhenobarb.de',
    'mhenobarb.ru',
    'mhenomeen.de',
    'mhenomeen.ru',
    'mhenominate.de',
    'mhenominate.ru',
    'mhenor.de',
    'mhenor.ru',
    'mhenophile.de',
    'mhenophile.ru',
    'mhenoracom.de',
    'mhenoracom.ru',
    'mhenorology.de',
    'mhenorology.ru',
    'mhenotype.de',
    'mhenotype.ru',
    'mhenouement.de',
    'mhenouement.ru',
  ]);

  // Whitelist of legitimate email providers
  private readonly legitimateDomains = new Set([
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'ymail.com',
    'aol.com',
    'icloud.com',
    'mail.com',
    'protonmail.com',
    'tutanota.com',
    'zoho.com',
    'inbox.com',
    'mail.ru',
    'gmx.com',
    'web.de',
    'msn.com',
    'live.com',
    'corporate.com',
    'business.com',
    'workmail.com',
  ]);

  /**
   * Validates email address format
   */
  validateEmailFormat(email: string): boolean {
    // RFC 5322 simplified regex for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Checks if email domain is disposable
   */
  isDisposableDomain(email: string): boolean {
    const domain = this.extractDomain(email);
    return this.disposableDomains.has(domain.toLowerCase());
  }

  /**
   * Extracts domain from email
   */
  private extractDomain(email: string): string {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1] : '';
  }

  /**
   * Validates complete email with format and domain checks
   */
  validateEmail(email: string): { valid: boolean; reason?: string } {
    if (!email || typeof email !== 'string') {
      return { valid: false, reason: 'Email is required' };
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check format
    if (!this.validateEmailFormat(trimmedEmail)) {
      return {
        valid: false,
        reason: 'Please enter a valid email address (example: name@example.com)',
      };
    }

    // Check for disposable domains
    if (this.isDisposableDomain(trimmedEmail)) {
      return {
        valid: false,
        reason: 'Disposable or temporary email addresses are not allowed. Please use a valid email provider.',
      };
    }

    return { valid: true };
  }

  /**
   * Throws BadRequestException if email is invalid
   */
  validateEmailOrThrow(email: string): void {
    const validation = this.validateEmail(email);
    if (!validation.valid) {
      throw new BadRequestException(validation.reason);
    }
  }

  /**
   * Generate a unique verification token
   */
  generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
  }

  /**
   * Generate verification code (6 digits)
   */
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
