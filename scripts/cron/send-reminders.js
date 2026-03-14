// scripts/cron/send-reminders.js
const fetch = require('node-fetch');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

function getTomorrowDate() {
  const today = new Date();
  
  // Create date for tomorrow in YYYY-MM-DD format
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Format as YYYY-MM-DD (this is what your database likely uses)
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

async function sendReminders() {
  const hoursBefore = process.argv[2] ? parseInt(process.argv[2]) : 24;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const tomorrowDate = getTomorrowDate();
  
  console.log(`🔔 Sending trip reminders for ${hoursBefore}h before departure...`);
  console.log(`📅 Looking for bookings on: ${tomorrowDate}`);
  console.log(`📡 Using base URL: ${baseUrl}`);

  try {
    const response = await fetch(`${baseUrl}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'dev-cron-secret'}`
      },
      body: JSON.stringify({
        type: 'trip-reminders',
        data: { 
          hoursBefore,
          targetDate: tomorrowDate 
        }
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Reminders sent successfully!');
      console.log('📊 Results:', JSON.stringify(data.result, null, 2));
    } else {
      console.error('❌ Failed to send reminders:', data.error);
    }
  } catch (error) {
    console.error('❌ Error sending reminders:', error);
  }
}

sendReminders();