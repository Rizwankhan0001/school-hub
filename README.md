# EduFee360 (school-hub)

School Fee Management SaaS — complete business & functional demo aligned to the BRD.

## Product coverage

| Module | Status in demo |
|--------|----------------|
| Student Management | ✅ |
| Fee Structure | ✅ |
| Installments | ✅ |
| Scholarships | ✅ |
| Online Payments | ✅ (simulated) |
| Payment Gateways | ✅ (Razorpay/PayU/Cashfree/Stripe/Paytm) |
| Receipts | ✅ |
| Due Tracking | ✅ |
| Fine Management | ✅ |
| Communication Center | ✅ |
| AI Collection Assistant | ✅ (voice queue + risk) |
| Reporting & Analytics | ✅ |
| Parent portal (app flows) | ✅ |
| Support tickets | ✅ |
| Super Admin multi-tenant | ✅ |
| Pricing / commercial model | ✅ |
| Teacher meetings (20-min slots) | ✅ |
| Teacher profiles, ratings & awards | ✅ |

## Roles

Super Admin · School Admin · Accountant · Support Agent · Parent

## Run

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Architecture note

This demo uses a Next.js web app with in-browser state (multi-tenant SaaS UX). Production mapping from the BRD:

- **Admin** → Model-driven / web app  
- **Parent** → Power Pages / mobile  
- **Data** → Dataverse or SQL with tenant isolation  
- **Workflows** → Power Automate / API workers  
- **AI calls** → Voice agent + notification queue  

## Commercial plans

- Starter ₹2,999/mo · Growth ₹7,999/mo · Enterprise custom
