# 🛒 Family Shopping App

A real-time shared shopping list built with React, Tailwind, and Supabase. Designed for families who want a fast, simple, and synchronized way to manage groceries together across all their devices.

## ✨ Features

- **Real-time sync**  
  All list changes (add, edit, complete, delete) are instantly reflected for every family member, powered by Supabase realtime.

- **Market Mode**  
  A shopping-focused view with larger tap targets and clear grouping, so it is easy to check off items while walking through the store.

- **PWA (Progressive Web App)**  
  Install the app on your home screen for a native-like, full-screen experience. Optimized for mobile, tablet, and desktop.

## 🧱 Tech Stack

- **Frontend**: React, Vite  
- **Styling**: Tailwind CSS  
- **Backend & Realtime**: Supabase (PostgreSQL + Realtime)  
- **Animations & UX**: Framer Motion  
- **State / Data fetching**: React Query (@tanstack/react-query)

## 🛠 Local Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/family-shopping-app.git
   cd Fmily-Shopping-App
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**

   Create a `.env.local` (or `.env`) file in the project root:

   ```bash
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

   Make sure the variable names match what is used in your Supabase client initialization.

4. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Then open the URL printed in the terminal (usually `http://localhost:5173` with Vite).

5. **Build for production (optional)**

   ```bash
   npm run build
   npm run preview
   ```

   This builds the optimized production bundle and serves it locally for testing.