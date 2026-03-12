// scripts/send-reminders.js
const fetch = require('node-fetch');

async function sendTripReminders() {
  try {
    const response = await fetch('http://localhost:3000/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      },
      body: JSON.stringify({
        type: 'trip-reminders',
        hoursBefore: 24
      })
    });

    const data = await response.json();
    console.log('Reminders sent:', data);
  } catch (error) {
    console.error('Error sending reminders:', error);
  }
}

sendTripReminders();