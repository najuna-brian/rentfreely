# RentFreely Mobile (Expo)

React Native MVP for RentFreely with a Zillow-style rental browsing flow for Uganda.

## 1) Configure environment

Copy `.env.example` to `.env` and set values:

```bash
cp .env.example .env
```

Required:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY`
- `EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY`

## 2) Start app

```bash
npm install
npm run start
```

Use Expo dev build for full native map support on both platforms.

## 3) Database setup

From repository root:

```bash
npx supabase init
```

Migrations live in `../supabase/migrations`.
