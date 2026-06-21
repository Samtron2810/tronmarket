# TronMarket - Frontend

This is the frontend application for TronMarket, an e-commerce platform.

## Tech Stack

- **React 19** - UI library
- **Vite 8** - Build tool and development server
- **React Router DOM v7** - Client-side routing
- **TanStack React Query** - Server state management & data fetching
- **Zustand** - Client state management
- **Axios** - HTTP client for API requests
- **Tailwind CSS v4** - Utility-first CSS framework
- **React Icons** - Icon library
- **React Paystack** - Payment gateway integration
- **React Toastify** - Toast notification system
- **ESLint** - Code linting and formatting

AI PROMPT:
pnpm add express-rate-limit redis zod
User Login/register
├─ Zod validates email/password
├─ Rate limiter prevents brute force attacks
└─ Redis stores session/token data

Product Catalog
├─ Redis caches product listings
└─ Reduces database load

Checkout
├─ Zod validates shipping/payment data
└─ Rate limiter protects checkout endpoint
