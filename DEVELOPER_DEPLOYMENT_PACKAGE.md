# 👨‍💻 Developer Deployment Package
## Complete Guide for Software Engineer

**Client:** Musa Mukoma, Munali, Lusaka, Zambia  
**Project:** VayaZed Bus Booking System  
**Package Date:** February 5, 2026

---

## 📦 WHAT'S INCLUDED IN THIS PACKAGE

This package contains:
1. ✅ Complete web application (Next.js)
2. ✅ Complete mobile application (React Native/Expo)
3. ✅ Database with seed data
4. ✅ All documentation
5. ✅ Deployment instructions
6. ✅ Testing guidelines
7. ✅ Configuration templates

---

## 🎯 YOUR MISSION

As the software engineer, you need to:

### Phase 1: Testing & Verification (Week 1)
1. ✅ Test all web app features
2. ✅ Test mobile apps on devices
3. ✅ Verify database operations
4. ✅ Test API endpoints
5. ✅ Complete booking flow test
6. ✅ Security audit

### Phase 2: Implementation (Week 2)
1. ✅ Implement payment gateway (Flutterwave)
2. ✅ Configure email service (Resend)
3. ✅ Configure SMS service (Africa's Talking)
4. ✅ Set up push notifications (Firebase)
5. ✅ Fix any bugs found

### Phase 3: Deployment (Week 3)
1. ✅ Deploy web app to production
2. ✅ Configure custom domain
3. ✅ Set up SSL certificate
4. ✅ Submit mobile apps to stores
5. ✅ Set up monitoring
6. ✅ Train client on system

---

## 📋 ACCOUNTS YOU NEED TO CREATE

### 1. Hosting & Infrastructure

#### Railway (Web Hosting) - RECOMMENDED
- **Purpose:** Host web application + PostgreSQL database
- **Cost:** $5-20/month (pay as you go)
- **Sign up:** https://railway.app
- **What you get:**
  - Web hosting
  - PostgreSQL database
  - Automatic SSL
  - Easy deployment
  - Free $5 credit

**Steps:**
1. Sign up with GitHub
2. Create new project
3. Add PostgreSQL service
4. Deploy from GitHub
5. Configure environment variables

---

#### Alternative: VPS (DigitalOcean/Linode)
- **Purpose:** Full control hosting
- **Cost:** $12-24/month
- **Sign up:** https://digitalocean.com or https://linode.com
- **What you get:**
  - Full server control
  - More configuration options
  - Better for scaling

**Only use if you prefer full control**

---

### 2. Mobile App Distribution

#### Expo EAS (Mobile Builds) - REQUIRED
- **Purpose:** Build iOS and Android apps
- **Cost:** FREE for basic, $29/month for production
- **Sign up:** https://expo.dev
- **What you get:**
  - Cloud builds
  - OTA updates
  - Push notifications
  - Analytics

**Steps:**
1. Sign up at expo.dev
2. Install EAS CLI: `npm install -g eas-cli`
3. Login: `eas login`
4. Configure: `eas build:configure`

---

#### Google Play Console - CLIENT HAS PAID ✅
- **Purpose:** Publish Android app
- **Cost:** $25 one-time (ALREADY PAID)
- **Account:** Client has this
- **What you need:**
  - Access to client's account
  - Or create under client's email

**Steps:**
1. Get access from client
2. Create app listing
3. Upload APK/AAB
4. Fill store details
5. Submit for review

---

#### Apple Developer Program - CLIENT HAS PAID ✅
- **Purpose:** Publish iOS app
- **Cost:** $99/year (ALREADY PAID)
- **Account:** Client has this
- **What you need:**
  - Access to client's account
  - Or create under client's email

**Steps:**
1. Get access from client
2. Create app in App Store Connect
3. Upload IPA
4. Fill store details
5. Submit for review

---

### 3. Payment Gateway

#### Flutterwave - CRITICAL, MUST IMPLEMENT
- **Purpose:** Accept payments (MTN, Airtel, Zamtel, Cards)
- **Cost:** FREE to sign up, 3.8% per transaction
- **Sign up:** https://flutterwave.com/zm
- **What you get:**
  - Mobile money (MTN, Airtel, Zamtel)
  - Card payments
  - Bank transfers
  - Webhooks
  - Dashboard

**Steps:**
1. Sign up for Zambia account
2. Complete KYC verification
3. Get API keys (test and live)
4. Implement in code
5. Test with test cards
6. Go live after approval

**Implementation Required:**
- Payment initiation
- Webhook handling
- Transaction verification
- Refund processing

---

### 4. Communication Services

#### Resend (Email) - RECOMMENDED
- **Purpose:** Send booking confirmations, receipts
- **Cost:** FREE for 3,000 emails/month, then $20/month
- **Sign up:** https://resend.com
- **What you get:**
  - Reliable email delivery
  - Email templates
  - Analytics
  - Easy API

**Steps:**
1. Sign up
2. Verify domain (or use resend.dev)
3. Get API key
4. Implement email sending
5. Create email templates

---

#### Africa's Talking (SMS) - RECOMMENDED
- **Purpose:** Send SMS notifications
- **Cost:** ~$0.01 per SMS in Zambia
- **Sign up:** https://africastalking.com
- **What you get:**
  - SMS delivery
  - Bulk SMS
  - Delivery reports
  - Zambia coverage

**Steps:**
1. Sign up
2. Add credit ($10-50 to start)
3. Get API key
4. Implement SMS sending
5. Test with Zambian numbers

---

#### Firebase (Push Notifications) - OPTIONAL
- **Purpose:** Mobile push notifications
- **Cost:** FREE for basic usage
- **Sign up:** https://firebase.google.com
- **What you get:**
  - Push notifications
  - Analytics
  - Crash reporting
  - Remote config

**Steps:**
1. Create Firebase project
2. Add Android app
3. Add iOS app
4. Download config files
5. Implement in mobile app

---

### 5. Monitoring & Analytics

#### Sentry (Error Tracking) - RECOMMENDED
- **Purpose:** Track errors and crashes
- **Cost:** FREE for 5,000 events/month
- **Sign up:** https://sentry.io
- **What you get:**
  - Error tracking
  - Performance monitoring
  - Release tracking
  - Alerts

**Steps:**
1. Sign up
2. Create project
3. Get DSN
4. Add to web and mobile apps
5. Configure alerts

---

#### UptimeRobot (Uptime Monitoring) - OPTIONAL
- **Purpose:** Monitor if site is up
- **Cost:** FREE for 50 monitors
- **Sign up:** https://uptimerobot.com
- **What you get:**
  - Uptime monitoring
  - Alerts
  - Status page
  - Reports

---

### 6. Domain & DNS

#### Namecheap/GoDaddy (Domain) - WAIT
- **Purpose:** Custom domain (e.g., zambiabus.com)
- **Cost:** $10-15/year
- **Sign up:** https://namecheap.com or https://godaddy.com

**⚠️ IMPORTANT: DO NOT BUY YET**
- Wait until app is fully tested
- Wait until deployment is successful
- Client should buy after your approval

---

## 💰 COST SUMMARY FOR CLIENT

### One-Time Costs (ALREADY PAID)
- ✅ Google Play Console: $25 (PAID)
- ✅ Apple Developer: $99/year (PAID)

### Monthly Costs (REQUIRED)
| Service | Cost | Priority |
|---------|------|----------|
| Railway Hosting | $5-20 | Critical |
| Expo EAS | $0-29 | Critical |
| Flutterwave | 3.8% per transaction | Critical |
| Resend (Email) | $0-20 | High |
| Africa's Talking (SMS) | ~$20-50 | High |
| Sentry | $0 | Medium |
| Domain | $1-2 | Medium |

**Total Monthly:** $25-120 (depending on usage)

### First Year Total
- **Minimum:** $300-500
- **Recommended:** $1,000-1,500
- **Expected Revenue:** K4.25M ($212,500)
- **ROI:** 14,000%+ (140x return)

---

## 🔧 CONFIGURATION CHANGES NEEDED

### 1. Environment Variables

Create `.env.local` file in web app:

```bash
# Database (Production)
DATABASE_URL="postgresql://user:password@host:5432/database"

# JWT Secret (Generate new one!)
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Flutterwave
FLUTTERWAVE_PUBLIC_KEY="FLWPUBK-xxxxx"
FLUTTERWAVE_SECRET_KEY="FLWSECK-xxxxx"
FLUTTERWAVE_ENCRYPTION_KEY="FLWSECK-xxxxx"

# Email (Resend)
RESEND_API_KEY="re_xxxxx"
FROM_EMAIL="bookings@zambiabus.com"

# SMS (Africa's Talking)
AFRICASTALKING_USERNAME="sandbox"
AFRICASTALKING_API_KEY="xxxxx"
AFRICASTALKING_SENDER_ID="ZAMBIABUS"

# App URLs
NEXT_PUBLIC_APP_URL="https://zambiabus.com"
NEXT_PUBLIC_API_URL="https://zambiabus.com/api"

# Sentry (Optional)
SENTRY_DSN="https://xxxxx@sentry.io/xxxxx"
```

---

### 2. Mobile App Configuration

Update `zambia-bus-mobile/app.json`:

```json
{
  "expo": {
    "name": "VayaZed Bus Booking",
    "slug": "zambia-bus-booking",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#198A00"
    },
    "ios": {
      "bundleIdentifier": "com.zambiabus.booking",
      "buildNumber": "1.0.0",
      "supportsTablet": true
    },
    "android": {
      "package": "com.zambiabus.booking",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#198A00"
      }
    },
    "extra": {
      "apiUrl": "https://zambiabus.com/api"
    }
  }
}
```

---

### 3. API Base URL

Update mobile app API calls:

**File:** `zambia-bus-mobile/src/config/api.ts`

```typescript
// Change from localhost to production
export const API_BASE_URL = 
  process.env.NODE_ENV === 'production'
    ? 'https://zambiabus.com/api'
    : 'http://localhost:3000/api';
```

---

### 4. Payment Configuration

**File:** `zambia-bus-booking/app/lib/payment.ts`

Create this file:

```typescript
import Flutterwave from 'flutterwave-node-v3';

const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY!,
  process.env.FLUTTERWAVE_SECRET_KEY!
);

export async function initiatePayment(data: {
  amount: number;
  email: string;
  phone: string;
  name: string;
  bookingReference: string;
}) {
  const payload = {
    tx_ref: data.bookingReference,
    amount: data.amount,
    currency: 'ZMW',
    redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/confirm`,
    customer: {
      email: data.email,
      phonenumber: data.phone,
      name: data.name,
    },
    customizations: {
      title: 'VayaZed Bus Booking',
      description: `Booking ${data.bookingReference}`,
      logo: 'https://zambiabus.com/logo.png',
    },
  };

  try {
    const response = await flw.Charge.card(payload);
    return response;
  } catch (error) {
    console.error('Payment error:', error);
    throw error;
  }
}

export async function verifyPayment(transactionId: string) {
  try {
    const response = await flw.Transaction.verify({ id: transactionId });
    return response;
  } catch (error) {
    console.error('Verification error:', error);
    throw error;
  }
}
```

---

### 5. Email Templates

**File:** `zambia-bus-booking/app/lib/email.ts`

Create this file:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBookingConfirmation(data: {
  to: string;
  bookingReference: string;
  route: string;
  date: string;
  seats: string;
  amount: number;
}) {
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: data.to,
    subject: `Booking Confirmation - ${data.bookingReference}`,
    html: `
      <h1>🎉 Booking Confirmed!</h1>
      <p>Your bus ticket has been booked successfully.</p>
      <h2>Booking Details:</h2>
      <ul>
        <li><strong>Reference:</strong> ${data.bookingReference}</li>
        <li><strong>Route:</strong> ${data.route}</li>
        <li><strong>Date:</strong> ${data.date}</li>
        <li><strong>Seats:</strong> ${data.seats}</li>
        <li><strong>Amount:</strong> K${data.amount}</li>
      </ul>
      <p>Please arrive 30 minutes before departure.</p>
      <p>Safe travels! 🚌</p>
    `,
  });
}
```

---

### 6. SMS Notifications

**File:** `zambia-bus-booking/app/lib/sms.ts`

Create this file:

```typescript
import AfricasTalking from 'africastalking';

const africastalking = AfricasTalking({
  apiKey: process.env.AFRICASTALKING_API_KEY!,
  username: process.env.AFRICASTALKING_USERNAME!,
});

const sms = africastalking.SMS;

export async function sendBookingSMS(data: {
  to: string;
  bookingReference: string;
  route: string;
  date: string;
}) {
  const message = `Zambia Bus: Your booking ${data.bookingReference} is confirmed for ${data.route} on ${data.date}. Safe travels!`;

  try {
    const result = await sms.send({
      to: [data.to],
      message,
      from: process.env.AFRICASTALKING_SENDER_ID,
    });
    return result;
  } catch (error) {
    console.error('SMS error:', error);
    throw error;
  }
}
```

---

## 🧪 TESTING CHECKLIST

### Before Deployment

#### Web App Testing
- [ ] Test customer registration
- [ ] Test customer login
- [ ] Test company login
- [ ] Test admin login
- [ ] Test bus search (all routes)
- [ ] Test seat selection
- [ ] Test booking creation
- [ ] Test payment flow (with test cards)
- [ ] Test email notifications
- [ ] Test SMS notifications
- [ ] Test booking cancellation
- [ ] Test company dashboard
- [ ] Test admin dashboard
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on mobile browser
- [ ] Test on tablet

#### Mobile App Testing
- [ ] Test on Android device
- [ ] Test on iOS device
- [ ] Test registration
- [ ] Test login
- [ ] Test bus search
- [ ] Test seat selection
- [ ] Test booking
- [ ] Test payment
- [ ] Test push notifications
- [ ] Test offline mode
- [ ] Test camera (QR code)
- [ ] Test deep linking

#### API Testing
- [ ] Test all endpoints with Postman
- [ ] Test authentication
- [ ] Test authorization
- [ ] Test error handling
- [ ] Test rate limiting
- [ ] Test input validation
- [ ] Test SQL injection prevention
- [ ] Test XSS prevention

#### Performance Testing
- [ ] Load test with 100 concurrent users
- [ ] Test search with 1000+ routes
- [ ] Test booking with 100+ concurrent bookings
- [ ] Check page load times
- [ ] Check API response times
- [ ] Check database query performance

#### Security Testing
- [ ] SQL injection test
- [ ] XSS test
- [ ] CSRF test
- [ ] Authentication bypass test
- [ ] Authorization bypass test
- [ ] Rate limiting test
- [ ] Input validation test

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Prepare Code

```bash
# Clone repository
git clone <repository-url>
cd zambia-bus-booking

# Install dependencies
npm install

# Run tests
npm test

# Build for production
npm run build
```

---

### Step 2: Set Up Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Add PostgreSQL
railway add postgresql

# Deploy
railway up
```

---

### Step 3: Configure Database

```bash
# Get database URL from Railway
railway variables

# Run migrations
npm run migrate

# Seed database (if needed)
node seed-database.js
node seed-routes.js
```

---

### Step 4: Configure Domain

1. Buy domain (e.g., zambiabus.com)
2. Add to Railway project
3. Update DNS records
4. Wait for SSL certificate
5. Test HTTPS

---

### Step 5: Build Mobile Apps

```bash
cd zambia-bus-mobile

# Install dependencies
npm install

# Configure EAS
eas build:configure

# Build Android
eas build --platform android

# Build iOS
eas build --platform ios

# Download builds
eas build:list
```

---

### Step 6: Submit to Stores

#### Google Play Store
1. Create app listing
2. Upload APK/AAB
3. Fill store details
4. Add screenshots
5. Submit for review
6. Wait 1-3 days

#### Apple App Store
1. Create app in App Store Connect
2. Upload IPA
3. Fill store details
4. Add screenshots
5. Submit for review
6. Wait 1-7 days

---

## 📊 MONITORING SETUP

### Set Up Sentry

```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard -i nextjs

# Configure
# Add DSN to .env.local
```

### Set Up UptimeRobot

1. Sign up at uptimerobot.com
2. Add monitor for your domain
3. Set up email alerts
4. Configure status page

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue 1: Database Connection Failed
**Solution:** Check DATABASE_URL in environment variables

### Issue 2: Payment Not Working
**Solution:** Verify Flutterwave API keys and test mode

### Issue 3: Emails Not Sending
**Solution:** Check Resend API key and domain verification

### Issue 4: SMS Not Sending
**Solution:** Check Africa's Talking credit balance and API key

### Issue 5: Mobile App Crashes
**Solution:** Check Sentry for error logs

### Issue 6: Slow Performance
**Solution:** Check database indexes and query optimization

---

## 📞 SUPPORT CONTACTS

### For Technical Issues
- **Expo Support:** https://expo.dev/support
- **Railway Support:** https://railway.app/help
- **Flutterwave Support:** support@flutterwave.com
- **Resend Support:** support@resend.com
- **Africa's Talking:** support@africastalking.com

### For Client Communication
- **Client:** Musa Mukoma
- **Location:** Munali, Lusaka, Zambia
- **Project:** VayaZed Bus Booking System

---

## ✅ FINAL CHECKLIST BEFORE LAUNCH

### Technical
- [ ] All tests passing
- [ ] Payment gateway working
- [ ] Email notifications working
- [ ] SMS notifications working
- [ ] Mobile apps tested on devices
- [ ] Security audit complete
- [ ] Performance optimized
- [ ] Error monitoring set up
- [ ] Backups configured

### Business
- [ ] Domain purchased and configured
- [ ] SSL certificate active
- [ ] Mobile apps submitted to stores
- [ ] Terms of service ready
- [ ] Privacy policy ready
- [ ] Support email set up
- [ ] Client trained on system

### Documentation
- [ ] User guide created
- [ ] Admin guide created
- [ ] API documentation complete
- [ ] Deployment guide complete
- [ ] Troubleshooting guide ready

---

## 🎯 SUCCESS CRITERIA

The deployment is successful when:
1. ✅ Web app is live and accessible
2. ✅ Users can register and login
3. ✅ Users can search for buses
4. ✅ Users can book tickets
5. ✅ Payments are processed successfully
6. ✅ Email confirmations are sent
7. ✅ SMS notifications are sent
8. ✅ Mobile apps are in app stores
9. ✅ No critical errors in logs
10. ✅ Client is satisfied

---

## 📝 DELIVERABLES TO CLIENT

After deployment, provide:
1. ✅ Live web app URL
2. ✅ Admin credentials
3. ✅ Mobile app store links
4. ✅ User guide
5. ✅ Admin guide
6. ✅ Support documentation
7. ✅ Monitoring dashboard access
8. ✅ Source code repository access
9. ✅ Database backup
10. ✅ Training session

---

## 💡 RECOMMENDATIONS

### For Developer
1. Start with testing - don't skip this
2. Implement payment gateway carefully
3. Test on real devices, not just emulators
4. Set up monitoring from day one
5. Keep client updated on progress
6. Document everything you do
7. Create a staging environment first
8. Don't rush - quality over speed

### For Client
1. Don't buy domain until app is tested
2. Wait for developer's approval before launch
3. Start with small marketing budget
4. Gather user feedback early
5. Be patient with app store reviews
6. Keep some budget for fixes
7. Plan for ongoing maintenance

---

**This package contains everything needed for successful deployment. Good luck! 🚀**

---

*Package Created: February 5, 2026*  
*Version: 1.0*  
*Status: Ready for Developer*