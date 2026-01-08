import { Job } from 'src/jobs/entities/job.entity';

export class JobCreatedEvent {
  constructor(public readonly job: Job) {}
}

export class JobAssignedEvent {
  constructor(public readonly job: Job, public readonly providerId: string) {}
}

export class JobAcceptedEvent {
  constructor(public readonly job: Job) {}
}

export class JobRejectedEvent {
  constructor(public readonly job: Job, public readonly reason?: string) {}
}

export class JobStartedEvent {
  constructor(public readonly job: Job) {}
}

export class JobCompletedEvent {
  constructor(public readonly job: Job) {}
}

export class JobCancelledEvent {
  constructor(public readonly job: Job, public readonly reason?: string) {}
}

export class JobStatusUpdatedEvent {
  constructor(public readonly job: Job, public readonly previousStatus: string) {}
}
