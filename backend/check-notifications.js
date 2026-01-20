const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-eu-west-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.qaahvcdqbbafkwherzez',
  password: 'NRS123blog',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  
  // Check recent notifications
  const notifs = await client.query(`
    SELECT id, title, data, created_at 
    FROM notifications 
    WHERE type = 'booking_created' 
    ORDER BY created_at DESC 
    LIMIT 5
  `);
  
  console.log('\n=== Recent Booking Notifications ===');
  notifs.rows.forEach(n => {
    console.log('---');
    console.log('Title:', n.title);
    console.log('Data:', JSON.stringify(n.data, null, 2));
    console.log('Has conversationId:', !!n.data?.conversationId);
  });
  
  // Check recent conversations
  const convs = await client.query(`
    SELECT id, participant_one_id, participant_two_id, property_id, last_message_content, created_at
    FROM conversations 
    ORDER BY created_at DESC 
    LIMIT 5
  `);
  
  console.log('\n=== Recent Conversations ===');
  convs.rows.forEach(c => {
    console.log('---');
    console.log('ID:', c.id);
    console.log('Participant 1:', c.participant_one_id);
    console.log('Participant 2:', c.participant_two_id);
    console.log('Last Message:', c.last_message_content);
  });
  
  await client.end();
}

main().catch(console.error);
