# Driver Payments Portal

A web application for managing driver payments with weekly (Batta) and monthly (Salary) settlement options.

## Live Demo
🔗 **Deployed App**: [Vercel Link](https://twilight-bus-driver-payment-portal.vercel.app/)

## Login Credentials
- **Email**: demo@example.com
- **Password**: demo123456

## Features
- ✅ Add trips for drivers with different payment preferences
- ✅ Process weekly settlements (Batta component)
- ✅ Process monthly settlements (Salary component)
- ✅ View payment history with filters
- ✅ Dashboard with real-time statistics
- ✅ Authentication with Supabase Auth

## Tech Stack
- **Frontend**: React + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Payment Logic
- **Driver 1 (Batta Only)**: Total payment as Batta → Settled weekly
- **Driver 2 (Salary Only)**: Total payment as Salary → Settled monthly
- **Driver 3 (Both)**: Batta settled weekly, Salary settled monthly

## Setup Locally
```bash
npm install
npm run dev
```

## Database Schema
- drivers (payment preferences)
- routes (batta & salary per trip)
- vehicles
- trips
- settlements
- settlement_items