import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  JobCreatedEvent,
  JobAssignedEvent,
  JobAcceptedEvent,
  JobRejectedEvent,
  JobStartedEvent,
  JobCompletedEvent,
  JobCancelledEvent,
  JobStatusUpdatedEvent,
} from './events/job.events';
import {
  MaintenanceTicketCreatedEvent,
  MaintenanceTicketAssignedEvent,
  MaintenanceTicketStatusUpdatedEvent,
  MaintenanceTicketJobLinkedEvent,
} from './events/maintenance-ticket.events';
import { EmailService } from 'src/common/email.service';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationType } from './entities/notification.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly usersService: UsersService,
  ) {}

  // ===== Job Events =====

  @OnEvent('job.created')
  async handleJobCreated(event: JobCreatedEvent) {
    this.logger.log(`[NOTIFICATION] ====== JOB CREATED EVENT RECEIVED ======`);
    this.logger.log(`[NOTIFICATION] Job created: ${event.job.id}`);
    this.logger.log(`[NOTIFICATION] Job clientId: ${event.job.clientId}`);
    this.logger.log(`[NOTIFICATION] Job providerId: ${event.job.providerId || 'none'}`);
    this.logger.log(`[NOTIFICATION] Job title: ${event.job.title}`);
    
    // Verify clientId exists
    if (!event.job.clientId) {
      this.logger.error(`[NOTIFICATION] ❌ ERROR: Job ${event.job.id} has no clientId! Cannot create notification.`);
      return;
    }
    
    // Create notification for the client confirming their request was created
    try {
      this.logger.log(`[NOTIFICATION] Creating notification for client ${event.job.clientId}...`);
      const notification = await this.notificationsService.create(
        event.job.clientId, // This should be the client's user ID
        NotificationType.JOB_CREATED,
        'Request Submitted',
        `Your service request "${event.job.title}" has been successfully submitted and is now pending provider response.`,
        {
          jobId: event.job.id,
          providerId: event.job.providerId,
        },
      );
      this.logger.log(`[NOTIFICATION] ✅ Successfully created notification for client ${event.job.clientId}: ${notification.id}`);
      this.logger.log(`[NOTIFICATION] Notification userId: ${notification.userId}`);
      
      // Emit notification via WebSocket
      this.notificationsGateway.sendNotificationToUser(
        event.job.clientId,
        notification,
      );
    } catch (error) {
      this.logger.error(`[NOTIFICATION] ❌ Failed to create notification for job ${event.job.id}:`, error);
      this.logger.error(`[NOTIFICATION] Error details:`, error.message, error.stack);
    }
    
    // TODO: Send email/SMS notification to provider (if assigned) or available providers
    // await this.emailService.sendJobCreatedNotification(event.job);
  }

  @OnEvent('job.assigned')
  async handleJobAssigned(event: JobAssignedEvent) {
    this.logger.log(`[NOTIFICATION] ====== JOB ASSIGNED EVENT RECEIVED ======`);
    this.logger.log(`[NOTIFICATION] Job assigned: ${event.job.id} to provider ${event.providerId}`);
    this.logger.log(`[NOTIFICATION] Job title: ${event.job.title}`);
    this.logger.log(`[NOTIFICATION] Job clientId: ${event.job.clientId}`);
    
    // Verify providerId exists
    if (!event.providerId) {
      this.logger.error(`[NOTIFICATION] ❌ ERROR: Job ${event.job.id} has no providerId! Cannot create notification.`);
      return;
    }
    
    // Create notification for the provider
    try {
      this.logger.log(`[NOTIFICATION] Creating notification for provider ${event.providerId}...`);
      
      // Try to get client name - fetch from database if not loaded in job entity
      let clientName = 'A client';
      try {
        if (event.job.client) {
          clientName = event.job.client.firstName && event.job.client.lastName
            ? `${event.job.client.firstName} ${event.job.client.lastName}`
            : event.job.client.email || 'A client';
        } else if (event.job.clientId) {
          // Fetch client if not loaded in job entity
          const client = await this.usersService.findOneById(event.job.clientId);
          if (client) {
            clientName = client.firstName && client.lastName
              ? `${client.firstName} ${client.lastName}`
              : client.email || 'A client';
          }
        }
      } catch (err) {
        this.logger.warn(`[NOTIFICATION] Could not fetch client name: ${err.message}`);
      }
      
      const notification = await this.notificationsService.create(
        event.providerId, // This is the provider's user ID
        NotificationType.JOB_CREATED, // Using JOB_CREATED since it's a new job assignment
        'New Service Request',
        `${clientName} has submitted a new service request: "${event.job.title}". Please review and respond.`,
        {
          jobId: event.job.id,
          clientId: event.job.clientId,
        },
      );
      this.logger.log(`[NOTIFICATION] ✅ Successfully created notification for provider ${event.providerId}: ${notification.id}`);
      this.logger.log(`[NOTIFICATION] Notification userId: ${notification.userId}`);
      
      // Emit notification via WebSocket
      this.notificationsGateway.sendNotificationToUser(
        event.providerId,
        notification,
      );
    } catch (error) {
      this.logger.error(`[NOTIFICATION] ❌ Failed to create notification for provider ${event.providerId}:`, error);
      this.logger.error(`[NOTIFICATION] Error details:`, error.message, error.stack);
    }
    
    // TODO: Send email/SMS notification to assigned provider
    // await this.emailService.sendJobAssignedNotification(event.job, event.providerId);
  }

  @OnEvent('job.accepted')
  async handleJobAccepted(event: JobAcceptedEvent) {
    this.logger.log(`[NOTIFICATION] Job accepted: ${event.job.id}`);
    this.logger.log(`[NOTIFICATION] Job clientId: ${event.job.clientId}`);
    
    // Create notification for the client
    // Try to get provider name - could be from User or Provider entity
    let providerName = 'Provider';
    if (event.job.provider) {
      providerName = event.job.provider.firstName && event.job.provider.lastName
        ? `${event.job.provider.firstName} ${event.job.provider.lastName}`
        : event.job.provider.email || 'Provider';
    }
    
    try {
      const notification = await this.notificationsService.create(
        event.job.clientId,
        NotificationType.JOB_ACCEPTED,
        'Request Accepted',
        `${providerName} accepted your service request: "${event.job.title}"`,
        {
          jobId: event.job.id,
          providerId: event.job.providerId,
        },
      );
      this.logger.log(`[NOTIFICATION] Created notification for client ${event.job.clientId}: ${notification.id}`);
      
      // Emit notification via WebSocket
      this.notificationsGateway.sendNotificationToUser(
        event.job.clientId,
        notification,
      );
    } catch (error) {
      this.logger.error(`[NOTIFICATION] Failed to create notification for job ${event.job.id}:`, error);
    }
    
    // TODO: Send email/SMS notification to client
    // await this.emailService.sendJobAcceptedNotification(event.job);
  }

  @OnEvent('job.rejected')
  async handleJobRejected(event: JobRejectedEvent) {
    this.logger.log(`[NOTIFICATION] Job rejected: ${event.job.id}`);
    // TODO: Send email/SMS notification to client
    // await this.emailService.sendJobRejectedNotification(event.job, event.reason);
  }

  @OnEvent('job.started')
  async handleJobStarted(event: JobStartedEvent) {
    this.logger.log(`[NOTIFICATION] Job started: ${event.job.id}`);
    
    // Create notification for the client
    let providerName = 'Provider';
    if (event.job.provider) {
      providerName = event.job.provider.firstName && event.job.provider.lastName
        ? `${event.job.provider.firstName} ${event.job.provider.lastName}`
        : event.job.provider.email || 'Provider';
    }
    
    const notification = await this.notificationsService.create(
      event.job.clientId,
      NotificationType.JOB_STARTED,
      'Job Started',
      `${providerName} has started working on your request: "${event.job.title}"`,
      {
        jobId: event.job.id,
        providerId: event.job.providerId,
      },
    );
    
    // Emit notification via WebSocket
    this.notificationsGateway.sendNotificationToUser(
      event.job.clientId,
      notification,
    );
    
    // TODO: Send email/SMS notification to client
    // await this.emailService.sendJobStartedNotification(event.job);
  }

  @OnEvent('job.completed')
  async handleJobCompleted(event: JobCompletedEvent) {
    this.logger.log(`[NOTIFICATION] Job completed: ${event.job.id}`);
    this.logger.log(`[NOTIFICATION] Job clientId: ${event.job.clientId}`);
    
    // Create notification for the client
    let providerName = 'Provider';
    if (event.job.provider) {
      providerName = event.job.provider.firstName && event.job.provider.lastName
        ? `${event.job.provider.firstName} ${event.job.provider.lastName}`
        : event.job.provider.email || 'Provider';
    }
    
    try {
      const notification = await this.notificationsService.create(
        event.job.clientId,
        NotificationType.JOB_COMPLETED,
        'Job Completed',
        `${providerName} has completed your request: "${event.job.title}"`,
        {
          jobId: event.job.id,
          providerId: event.job.providerId,
        },
      );
      this.logger.log(`[NOTIFICATION] Created notification for client ${event.job.clientId}: ${notification.id}`);
      
      // Emit notification via WebSocket
      this.notificationsGateway.sendNotificationToUser(
        event.job.clientId,
        notification,
      );
    } catch (error) {
      this.logger.error(`[NOTIFICATION] Failed to create notification for job ${event.job.id}:`, error);
    }
    
    // TODO: Send email/SMS notification to client
    // await this.emailService.sendJobCompletedNotification(event.job);
  }

  @OnEvent('job.cancelled')
  async handleJobCancelled(event: JobCancelledEvent) {
    this.logger.log(`[NOTIFICATION] Job cancelled: ${event.job.id}`);
    // TODO: Send email/SMS notification to relevant parties
    // await this.emailService.sendJobCancelledNotification(event.job, event.reason);
  }

  @OnEvent('job.status.updated')
  async handleJobStatusUpdated(event: JobStatusUpdatedEvent) {
    this.logger.log(
      `[NOTIFICATION] Job status updated: ${event.job.id} from ${event.previousStatus} to ${event.job.status}`,
    );
    // TODO: Send email/SMS notification based on status change
    // await this.emailService.sendJobStatusUpdatedNotification(event.job, event.previousStatus);
  }

  // ===== Maintenance Ticket Events =====

  @OnEvent('maintenance-ticket.created')
  async handleMaintenanceTicketCreated(event: MaintenanceTicketCreatedEvent) {
    this.logger.log(`[NOTIFICATION] Maintenance ticket created: ${event.ticket.id}`);
    // TODO: Send email/SMS notification to property owner
    // await this.emailService.sendMaintenanceTicketCreatedNotification(event.ticket);
  }

  @OnEvent('maintenance-ticket.assigned')
  async handleMaintenanceTicketAssigned(event: MaintenanceTicketAssignedEvent) {
    this.logger.log(
      `[NOTIFICATION] Maintenance ticket assigned: ${event.ticket.id} to provider ${event.providerId}`,
    );
    // TODO: Send email/SMS notification to assigned provider and tenant
    // await this.emailService.sendMaintenanceTicketAssignedNotification(event.ticket, event.providerId);
  }

  @OnEvent('maintenance-ticket.status.updated')
  async handleMaintenanceTicketStatusUpdated(event: MaintenanceTicketStatusUpdatedEvent) {
    this.logger.log(
      `[NOTIFICATION] Maintenance ticket status updated: ${event.ticket.id} from ${event.previousStatus} to ${event.ticket.status}`,
    );
    // TODO: Send email/SMS notification based on status change
    // await this.emailService.sendMaintenanceTicketStatusUpdatedNotification(event.ticket, event.previousStatus);
  }

  @OnEvent('maintenance-ticket.job.linked')
  async handleMaintenanceTicketJobLinked(event: MaintenanceTicketJobLinkedEvent) {
    this.logger.log(
      `[NOTIFICATION] Maintenance ticket linked to job: ${event.ticket.id} -> ${event.jobId}`,
    );
    // TODO: Send email/SMS notification to relevant parties
    // await this.emailService.sendMaintenanceTicketJobLinkedNotification(event.ticket, event.jobId);
  }
}
