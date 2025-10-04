# 🎃 Gabyghoul's Halloween Boat Party 🎃

A spooky horror-themed React app for Gaby's Halloween boat party with RSVP functionality and Stripe payment integration.

## 🚀 Features

- **Horror-themed UI** with gothic fonts and spooky animations
- **Party details** with boarding times and location info
- **RSVP form** with ticket purchase functionality
- **Stripe payment integration** for secure transactions
- **WhatsApp group integration** for party updates and community
- **Admin panel** to view RSVP list and manage attendees
- **Responsive design** that works on all devices
- **Database storage** with Vercel Postgres for persistent RSVP data

## 🛠️ Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd gabyghoul-party
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file and add your keys:
   ```
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   REACT_APP_ADMIN_PASSWORD=your_admin_password_here
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

## 💳 Stripe Setup

1. Create a [Stripe account](https://stripe.com)
2. Get your API keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
3. Add them to your `.env.local` file:
   - `REACT_APP_STRIPE_PUBLISHABLE_KEY` - Your publishable key (starts with pk_test_)
   - `STRIPE_SECRET_KEY` - Your secret key (starts with sk_test_)
4. Set up webhooks (optional but recommended):
   - Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
   - Add endpoint: `https://your-domain.vercel.app/api/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`
5. For production, use your live keys (pk_live_ and sk_live_)

## 📱 WhatsApp Group Integration

After RSVP confirmation, guests are directed to join the WhatsApp group for:
- Party updates and announcements
- Spooky music and vibes
- Connecting with other party-goers
- Pre-party hype and coordination

**No SMS setup required** - just a simple WhatsApp group link!

## 🚀 Deploy to Vercel (Free!)

### Option 1: Deploy with Vercel CLI
```bash
npm install -g vercel
vercel
```

### Option 2: Deploy with GitHub
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Vercel will automatically deploy on every push

### Option 3: Drag & Drop
1. Run `npm run build`
2. Go to [vercel.com](https://vercel.com)
3. Drag the `build` folder to deploy

## 🔐 Admin Access

- **Password**: `gabyghoul2024`
- Access the admin panel to view all RSVPs and guest counts

## 🎨 Customization

- Edit `src/App.css` to change colors, fonts, and styling
- Modify party details in `src/App.tsx`
- Update the admin password in the `handleAdminLogin` function

## 📱 Features

- **Responsive design** - works on desktop, tablet, and mobile
- **Horror animations** - spooky effects and transitions
- **Form validation** - ensures all required fields are filled
- **Payment processing** - secure Stripe integration
- **Data persistence** - RSVPs saved in browser localStorage

## 🎃 Party Details

- **Boarding**: 9:15 PM
- **Take Off**: 9:25 PM  
- **Return**: 11:30 PM
- **After Party**: X Club
- **Host**: Gabyghoul
- **Price**: $25 per person

## 🛡️ Security Notes

- **Real Stripe Integration**: This app now processes real payments through Stripe
- **Backend API**: Uses Vercel Functions for secure payment processing
- **Database**: RSVPs are stored in Vercel Postgres database
- **Environment Variables**: Keep your Stripe secret keys secure and never commit them
- **Admin password**: Configurable via environment variable
- **Webhooks**: Automatically saves RSVPs to database on successful payments

## 🗄️ Database Setup

1. **Add Vercel Postgres** to your project in the Vercel dashboard
2. **Initialize the database** by calling `/api/init-db` endpoint
3. **RSVPs are automatically saved** when payments succeed via webhooks

## 💰 Refund System

The app includes automatic refund functionality:

### **Automatic Refunds (DELETE endpoint)**
- **DELETE `/api/rsvps/[id]`** - Automatically refunds and deletes RSVP
- **Full refund** - Refunds the entire payment amount
- **Customer notification** - Stripe automatically emails the customer

### **Manual Refunds (Refund endpoint)**
- **POST `/api/rsvps/[id]/refund`** - Process refund without deleting RSVP
- **Partial refunds** - Specify amount in request body
- **Custom reasons** - Add refund reason in request body

### **Refund Tracking**
- **Database storage** - All refunds are tracked in the database
- **Stripe integration** - Refund IDs and amounts stored
- **Status updates** - Payment status updated to 'refunded'