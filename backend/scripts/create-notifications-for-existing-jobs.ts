import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { JobsService } from '../src/jobs/jobs.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { UsersService } from '../src/users/users.service';
import { NotificationType } from '../src/notifications/entities/notification.entity';
import { Repository, Not, IsNull } from 'typeorm';
import { Job } from '../src/jobs/entities/job.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

async function createNotificationsForExistingJobs() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const jobsService = app.get(JobsService);
  const notificationsService = app.get(NotificationsService);
  const usersService = app.get(UsersService);
  const jobRepository = app.get<Repository<Job>>(getRepositoryToken(Job));

  console.log('🔍 Finding jobs with assigned providers...');
  
  // Find all jobs that have a providerId assigned
  const jobsWithProviders = await jobRepository.find({
    where: {
      providerId: Not(IsNull()),
    },
    relations: ['client', 'provider'],
    order: { createdAt: 'DESC' },
  });

  console.log(`📋 Found ${jobsWithProviders.length} jobs with assigned providers`);

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const job of jobsWithProviders) {
    try {
      // Check if notification already exists for this job
      const existingNotifications = await notificationsService.findByUserId(job.providerId, {
        limit: 100,
      });

      const notificationExists = existingNotifications.notifications.some(
        (n) => n.data?.jobId === job.id && n.type === NotificationType.JOB_CREATED,
      );

      if (notificationExists) {
        console.log(`⏭️  Skipping job ${job.id} - notification already exists`);
        skippedCount++;
        continue;
      }

      // Get client name
      let clientName = 'A client';
      if (job.client) {
        clientName = job.client.firstName && job.client.lastName
          ? `${job.client.firstName} ${job.client.lastName}`
          : job.client.email || 'A client';
      } else if (job.clientId) {
        try {
          const client = await usersService.findOneById(job.clientId);
          if (client) {
            clientName = client.firstName && client.lastName
              ? `${client.firstName} ${client.lastName}`
              : client.email || 'A client';
          }
        } catch (err) {
          console.warn(`⚠️  Could not fetch client for job ${job.id}: ${err.message}`);
        }
      }

      // Create notification for provider
      await notificationsService.create(
        job.providerId,
        NotificationType.JOB_CREATED,
        'New Service Request',
        `${clientName} has submitted a new service request: "${job.title}". Please review and respond.`,
        {
          jobId: job.id,
          clientId: job.clientId,
        },
      );

      console.log(`✅ Created notification for provider ${job.providerId} for job ${job.id}`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Error creating notification for job ${job.id}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Created: ${createdCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📋 Total: ${jobsWithProviders.length}`);

  await app.close();
  process.exit(0);
}

createNotificationsForExistingJobs().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
