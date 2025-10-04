const sgMail = require('@sendgrid/mail');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phoneNumber, name, guests } = req.body;

    if (!phoneNumber || !name) {
      return res.status(400).json({ error: 'Phone number and name are required' });
    }

    // Initialize SendGrid
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Format phone number for SMS (SendGrid uses email-to-SMS)
    let formattedPhone = phoneNumber.replace(/\D/g, ''); // Remove all non-digits
    if (formattedPhone.length === 10) {
      formattedPhone = formattedPhone + '@txt.att.net'; // AT&T SMS gateway
    } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
      formattedPhone = formattedPhone.substring(1) + '@txt.att.net';
    } else {
      // For other carriers, try common SMS gateways
      const cleanNumber = formattedPhone.replace(/^1/, '');
      formattedPhone = cleanNumber + '@txt.att.net';
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

    // Send SMS via SendGrid
    const msg = {
      to: formattedPhone,
      from: process.env.SENDGRID_FROM_EMAIL, // Your verified sender email
      subject: 'GABYGHOUL Party Confirmation',
      text: message,
      html: `<p>${message.replace(/\n/g, '<br>')}</p>`
    };

    const result = await sgMail.send(msg);
    console.log('SMS sent successfully via SendGrid:', result[0].statusCode);

    return res.status(200).json({ 
      success: true, 
      messageId: result[0].headers['x-message-id'],
      message: 'SMS sent successfully' 
    });

  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Handle specific SendGrid errors
    if (error.response) {
      const { status, body } = error.response;
      if (status === 400) {
        return res.status(400).json({ error: 'Invalid phone number or email format' });
      } else if (status === 401) {
        return res.status(500).json({ error: 'SendGrid API key invalid' });
      } else if (status === 403) {
        return res.status(500).json({ error: 'SendGrid sender not verified' });
      }
    }

    return res.status(500).json({ 
      error: 'Failed to send SMS',
      details: error.message 
    });
  }
}
