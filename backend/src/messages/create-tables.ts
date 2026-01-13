import { DataSource } from 'typeorm';

export async function createMessagesTables(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    // Create notifications table if not exists
    const notificationsExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      );
    `);
    
    if (!notificationsExists[0].exists) {
      console.log('[MESSAGES] Creating notifications table...');
      
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE notification_type AS ENUM (
            'job_created', 'job_accepted', 'job_rejected', 'job_started', 
            'job_completed', 'job_cancelled', 'job_status_updated',
            'maintenance_ticket_created', 'maintenance_ticket_assigned',
            'maintenance_ticket_status_updated', 'maintenance_ticket_job_linked'
          );
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type notification_type NOT NULL,
          title varchar(255) NOT NULL,
          message text NOT NULL,
          data jsonb,
          "isRead" boolean DEFAULT false,
          "createdAt" timestamp with time zone DEFAULT now()
        );
      `);
      
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications("userId", "isRead");
        CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications("userId", "createdAt");
      `);
      
      console.log('[MESSAGES] Notifications table created!');
    }
    
    // Check if conversations table exists
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'conversations'
      );
    `);
    
    if (!tableExists[0].exists) {
      console.log('[MESSAGES] Creating conversations and messages tables...');
      
      // Create message_type enum
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE message_type AS ENUM ('text', 'image', 'file', 'system');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      
      // Create conversations table
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS conversations (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          participant_one_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          participant_two_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
          last_message_content text,
          last_message_at timestamp with time zone,
          participant_one_unread_count integer DEFAULT 0,
          participant_two_unread_count integer DEFAULT 0,
          is_blocked boolean DEFAULT false,
          blocked_by uuid,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
        );
      `);
      
      // Create messages table
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          content text NOT NULL,
          message_type message_type DEFAULT 'text',
          attachments jsonb DEFAULT '[]',
          is_read boolean DEFAULT false,
          read_at timestamp with time zone,
          is_deleted boolean DEFAULT false,
          deleted_at timestamp with time zone,
          created_at timestamp with time zone DEFAULT now()
        );
      `);
      
      // Create indexes
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS idx_conversations_participant_one ON conversations(participant_one_id);
        CREATE INDEX IF NOT EXISTS idx_conversations_participant_two ON conversations(participant_two_id);
        CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
      `);
      
      console.log('[MESSAGES] Tables created successfully!');
    } else {
      // Check if messages table has the right columns, add missing ones
      const columnCheck = await queryRunner.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'read_at';
      `);
      
      if (columnCheck.length === 0) {
        console.log('[MESSAGES] Adding missing columns to messages table...');
        await queryRunner.query(`
          ALTER TABLE messages 
          ADD COLUMN IF NOT EXISTS read_at timestamp with time zone,
          ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
        `);
        console.log('[MESSAGES] Columns added!');
      }
      
      console.log('[MESSAGES] Tables already exist');
    }
  } catch (error) {
    console.error('[MESSAGES] Error creating tables:', error);
  } finally {
    await queryRunner.release();
  }
}
