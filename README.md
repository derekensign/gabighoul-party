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
   cd gabighoul-party
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add your Stripe publishable key:
   ```
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

## 💳 Stripe Setup

1. Create a [Stripe account](https://stripe.com)
2. Get your publishable key from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
3. Add it to your `.env.local` file
4. For production, use your live publishable key

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

- **Password**: `gabighoul2024`
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

- This is a demo app - in production, you'd want a backend API
- Payment processing is simulated for demo purposes
- Admin password is hardcoded (change this for production)
- RSVP data is stored in localStorage (not persistent across devices)

## 📄 License

MIT License - feel free to use this for your own spooky parties! 🎃