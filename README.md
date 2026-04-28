# RentFreely — ODE-Powered Rental App

A map-centric rental listing app for Uganda, built as a custom app on the Open Data Ensemble (ODE) platform.

## Architecture

- **Frontend**: Vite + React + TailwindCSS (custom app bundle)
- **Backend**: Synkronus (Go + PostgreSQL) — uses existing observations table
- **Mobile**: Formulus React Native shell (rebranded to RentFreely)
- **Maps**: Google Maps JS API (free tier)
- **Auth**: JWT via Synkronus
- **Storage**: Synkronus attachment service
- **Sync**: Built-in version-based sync

## Development

```bash
# Frontend dev
cd app
npm install
npm run dev
# Open http://localhost:5173

# Backend (Synkronus)
cd ../../ode
docker compose up -d
# API at http://localhost:8080
```

## Project Structure

```
rentfreely/
├── app/                    # Vite React app
│   ├── src/
│   │   ├── screens/       # Main screens
│   │   ├── components/    # Reusable UI
│   │   ├── stores/        # Zustand state
│   │   ├── services/      # API & utilities
│   │   └── utils/         # Helpers
│   ├── public/
│   │   ├── app.config.json  # ODE app config
│   │   └── formulus-load.js # Bridge loader
│   └── package.json
├── forms/                  # JSON Schema forms (optional)
├── bundle/                 # Built output
└── deploy.sh              # Build & upload script
```

## Key Features

- **Map-based browsing** with price pins
- **Property listings** with photos, amenities, location
- **Direct WhatsApp contact** to landlords
- **Offline-first** with sync
- **Multi-role**: Tenant, Landlord, Agent
- **No external services** — everything runs on ODE

## Data Model

All data stored as `observations` in Synkronus:

- `user_profile` — User info and roles
- `property_listing` — Property data, photos, geolocation
- `inquiry` — Tenant messages
- `review` — Property ratings
- `saved_listing` — Bookmarks

## Deployment

```bash
# Build bundle
cd app && npm run build

# Create ODE bundle
zip -r ../bundle/bundle.zip dist/ forms/

# Upload to Synkronus
synk app-bundle push ../bundle/bundle.zip

# Pre-bundle in Formulus APK (for release)
cp ../bundle/bundle.zip ../../ode/formulus/android/app/src/main/assets/pre_bundle.zip
```

## Google Maps API

Set environment variable:
```bash
export VITE_GOOGLE_MAPS_KEY=AIzaSyCJZZCOTkD5M21wGYbYulC4t6X-afU_osY
```

## License

MIT
