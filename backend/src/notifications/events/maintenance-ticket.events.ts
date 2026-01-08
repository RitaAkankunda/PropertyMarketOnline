import { MaintenanceTicket } from 'src/maintenance-tickets/entities/maintenance-ticket.entity';

export class MaintenanceTicketCreatedEvent {
  constructor(public readonly ticket: MaintenanceTicket) {}
}

export class MaintenanceTicketAssignedEvent {
  constructor(public readonly ticket: MaintenanceTicket, public readonly providerId: string) {}
}

export class MaintenanceTicketStatusUpdatedEvent {
  constructor(
    public readonly ticket: MaintenanceTicket,
    public readonly previousStatus: string,
  ) {}
}

export class MaintenanceTicketJobLinkedEvent {
  constructor(public readonly ticket: MaintenanceTicket, public readonly jobId: string) {}
}
