const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Debug logging
  console.log('📧 Email confirmation request received');
  console.log('Request body:', req.body);
  console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);

  const { name, email, guests } = req.body;

  if (!name || !email || !guests) {
    console.log('❌ Missing required fields:', { name: !!name, email: !!email, guests: !!guests });
    return res.status(400).json({ 
      message: 'Missing required fields',
      received: { name: !!name, email: !!email, guests: !!guests }
    });
  }

  if (!process.env.RESEND_API_KEY) {
    console.log('❌ RESEND_API_KEY not found in environment variables');
    return res.status(500).json({ message: 'Email service not configured' });
  }

  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>GABYGHOUL Halloween Boat Party - RSVP Confirmed</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              background: linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a0a 100%);
              color: #ff6666;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: linear-gradient(135deg, #1a0a0a 0%, #2a0a0a 50%, #1a0a0a 100%);
              border: 3px solid #ff0000;
              border-radius: 20px;
              padding: 30px;
              box-shadow: 0 0 30px rgba(255, 0, 0, 0.3);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .title {
              color: #ff0000;
              font-size: 2.5rem;
              margin-bottom: 10px;
              text-shadow: 0 0 15px rgba(255, 0, 0, 0.8);
            }
            .subtitle {
              color: #ff6666;
              font-size: 1.2rem;
              margin-bottom: 20px;
            }
            .details-box {
              background: rgba(255, 0, 0, 0.1);
              border: 2px solid #ff0000;
              border-radius: 15px;
              padding: 20px;
              margin: 20px 0;
            }
            .detail-item {
              margin: 10px 0;
              font-size: 1.1rem;
            }
            .whatsapp-button {
              display: inline-block;
              background: linear-gradient(45deg, #25D366, #128C7E);
              color: white;
              padding: 15px 30px;
              border-radius: 25px;
              text-decoration: none;
              font-weight: bold;
              font-size: 1.1rem;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 0.9rem;
              opacity: 0.8;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="title">WELCOME TO THE NIGHTMARE!</h1>
              <p class="subtitle">RSVP Confirmed for GABYGHOUL's Halloween Boat Party</p>
            </div>
            
            <p style="font-size: 1.2rem; text-align: center; margin-bottom: 30px;">
              Hello <strong style="color: #ff0000;">${name}</strong>!<br>
              Your soul has been claimed for the spookiest boat party of the year! 👻
            </p>
            
            <div class="details-box">
              <h3 style="color: #ff0000; text-align: center; margin-bottom: 20px;">🚢 PARTY DETAILS 🚢</h3>
              <div class="detail-item">📅 <strong>Date:</strong> October 25th, 2025</div>
              <div class="detail-item">⏰ <strong>Boarding Time:</strong> 9:15 PM</div>
              <div class="detail-item">🚢 <strong>Departure:</strong> 9:25 PM</div>
              <div class="detail-item">📍 <strong>Location:</strong> 208 Barton Springs Road, Austin, TX 78704</div>
              <div class="detail-item">🏃 <strong>Return:</strong> 11:30 PM</div>
              <div class="detail-item">🌴 <strong>After Party:</strong> Coconut Club</div>
              <div class="detail-item">👥 <strong>Guests:</strong> ${guests}</div>
            </div>
            
            <div style="text-align: center;">
              <a href="https://chat.whatsapp.com/BpT9NYyu7UILMnQppoVEqS" class="whatsapp-button">
                💬 Join WhatsApp Group for Updates
              </a>
            </div>
            
            <div class="details-box">
              <h4 style="color: #ff0000; margin-bottom: 15px;">🎃 IMPORTANT REMINDERS 🎃</h4>
              <p>• Arrive 15 minutes early for boarding</p>
              <p>• Wear your scariest costume!</p>
              <p>• Don't forget your ID for entry</p>
              <p>• Get ready for a night of horror and fun on the water! 🌊</p>
            </div>
            
            <div class="footer">
              <p>Can't wait to see you on the dark side... 🌙</p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log('📧 Attempting to send email to:', email);
    
        const { data, error } = await resend.emails.send({
          from: 'GABYGHOUL Party <onboarding@resend.dev>',
          to: ['derekensign@gmail.com'], // Temporary: only send to your email for testing
      subject: '🎃 RSVP Confirmed - Welcome to the Nightmare!',
      html: emailHtml,
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return res.status(400).json({ 
        error: error.message,
        details: error
      });
    }

    console.log('✅ Email sent successfully:', data);
    res.status(200).json({ success: true, messageId: data.id });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
}

export default handler;
