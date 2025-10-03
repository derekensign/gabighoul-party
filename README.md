# 🎃 Gabyghoul's Halloween Boat Party 🎃

A spooky horror-themed React app for Gaby's Halloween boat party with RSVP functionality and Stripe payment integration.

## 🚀 Features

- **Horror-themed UI** with gothic fonts and spooky animations
- **Party details** with boarding times and location info
- **RSVP form** with ticket purchase functionality
- **Stripe payment integration** for secure transactions
- **Admin panel** to view RSVP list and manage attendees
- **Responsive design** that works on all devices
- **Local storage** for RSVP data persistence

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
   Create a `.env.local` file and add your Stripe keys:
   ```
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
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
- **Environment Variables**: Keep your Stripe secret keys secure and never commit them
- **Admin password**: Hardcoded (change this for production)
- **RSVP data**: Stored in localStorage (not persistent across devices)
- **Webhooks**: Optional but recommended for production payment confirmations

## 📄 License

MIT License - feel free to use this for your own spooky parties! 🎃# Environment variables configured for Stripe integration
