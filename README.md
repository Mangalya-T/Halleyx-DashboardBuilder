# Halleyx Dashboard Builder

Enterprise-grade custom dashboard builder with drag-and-drop widgets and customer order management.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, react-grid-layout, Recharts, Zustand, React Hook Form, Zod.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (via Mongoose).

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Environment Variables:
   - Copy `.env.example` to `.env`.
   - Set `MONGO_URI` to your MongoDB connection string.

## Running the Project

To start the development server (both Frontend and Backend):
```bash
npm run dev
```

The application will be available at port 3000.

## Features
- **Dashboard Builder**: Drag and drop widgets, resize, and configure them.
- **Order Management**: Full CRUD system for customer orders.
- **Real-time Updates**: Powered by MongoDB change streams (optional) or regular polling.
- **Responsive Layout**: Adapts to Desktop, Tablet, and Mobile.
- **Date Filtering**: Global filter for all analytics.
