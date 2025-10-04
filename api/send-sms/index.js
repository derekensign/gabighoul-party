const twilio = require('twilio');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phoneNumber, name, guests } = req.body;

    if (!phoneNumber || !name) {
      return res.status(400).json({ error: 'Phone number and name are required' });
    }

    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Format phone number (ensure it starts with +1 for US)
    let formattedPhone = phoneNumber.replace(/\D/g, ''); // Remove all non-digits
    if (formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone;
    } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
      formattedPhone = '+' + formattedPhone;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    // Create SMS message with party details
    const message = `🎃🎉 CONGRATULATIONS ${name.toUpperCase()}! 🎉🎃

You're officially invited to GABYGHOUL's SPOOKY BOAT PARTY! 

📅 DATE: October 31st, 2024
⏰ TIME: 7:00 PM - 11:00 PM
📍 LOCATION: 208 Barton Springs Road, Austin, TX 78704
👻 GUESTS: ${guests} ${guests === 1 ? 'ticket' : 'tickets'} confirmed

🎵 Join our WhatsApp group for updates, music, and spooky vibes:
https://chat.whatsapp.com/YOUR_GROUP_LINK

💀 See you on the haunted waters! 💀

- GABYGHOUL Party Crew`;

    // Send SMS
    const messageResult = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    console.log('SMS sent successfully:', messageResult.sid);

    return res.status(200).json({ 
      success: true, 
      messageId: messageResult.sid,
      message: 'SMS sent successfully' 
    });

  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Handle specific Twilio errors
    if (error.code === 21211) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    } else if (error.code === 21614) {
      return res.status(400).json({ error: 'Phone number is not a valid mobile number' });
    } else if (error.code === 21408) {
      return res.status(400).json({ error: 'Permission to send SMS to this number denied' });
    }

    return res.status(500).json({ 
      error: 'Failed to send SMS',
      details: error.message 
    });
  }
}
