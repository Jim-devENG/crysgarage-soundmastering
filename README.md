# Crys Audio Processing Application

## Prerequisites

- Node.js (v18 or higher)
- PHP 8.2 or higher
- Composer
- PostgreSQL 17
- npm or yarn

## Setup Instructions

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd crys
   ```

2. **Install Backend Dependencies**

   ```bash
   cd backend
   composer install
   cp .env.example .env
   php artisan key:generate
   ```

3. **Install Frontend Dependencies**

   ```bash
   cd frontend
   npm install
   ```

4. **Configure Environment Variables**

   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Update the following variables:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `NEXTAUTH_SECRET`: Generate a secure random string
     - `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`: Your PayPal API credentials
     - `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Your Stripe API credentials

5. **Set Up Database**

   ```bash
   cd frontend
   npx prisma generate
   npx prisma migrate dev
   npx ts-node prisma/seed.ts
   ```

6. **Start the Application**

   - Run `start.bat` in the root directory
   - Or start each service manually:

     ```bash
     # Terminal 1 - Backend
     cd backend
     php artisan serve

     # Terminal 2 - Queue Worker
     cd backend
     php artisan queue:work

     # Terminal 3 - Frontend
     cd frontend
     npm run dev
     ```

## Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Development

- Frontend is built with Next.js 14
- Backend is built with Laravel
- Database uses PostgreSQL with Prisma ORM
- Authentication uses NextAuth.js

## Troubleshooting

1. **Database Connection Issues**

   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env files
   - Verify database credentials

2. **Authentication Issues**

   - Check NEXTAUTH_SECRET is set
   - Verify NEXTAUTH_URL matches your frontend URL
   - Ensure database migrations are up to date

3. **Queue Worker Issues**
   - Check Laravel logs in storage/logs
   - Verify queue configuration in .env
   - Restart queue worker if needed

## Support

For issues and support, please create an issue in the repository.
