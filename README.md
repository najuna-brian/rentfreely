# Rentfreely v1.0 - Simple Property Registration App

A minimal ODE custom app for registering rental properties with Google Maps integration.

## Features

- **Interactive Google Maps**: Click to select property location
- **House Registration Form**: Collect photo, name, and GPS coordinates
- **Mobile-Friendly**: Responsive design for field use
- **Simple v1.0 Design**: Following ODE tutorial patterns

## Structure

```
rentfreely-v1.0.0/
├── app/
│   ├── index.html          # Main page with Google Maps
│   ├── style.css          # Modern styling
│   └── map.js             # Google Maps functionality
└── forms/
    └── register_house/
        ├── schema.json    # House registration data structure
        └── ui.json        # Form UI layout
```

## Form Fields

- **Photo**: House image (ODE photo type)
- **Name**: House name/title (required)
- **Location**: GPS coordinates (auto-filled from map click)
- **Description**: Optional property details

## Usage

1. Click on the map to select a property location
2. Click "Register This House" to open the registration form
3. Fill in property details and upload photo
4. Submit to save the property data

## Deployment

1. Zip the entire `rentfreely-v1.0.0` folder
2. Upload to your Synkronus server via:
   - Web portal: App Bundle upload page
   - CLI: `./synk app-bundle upload rentfreely-v1.0.0.zip -a`

## Requirements

- ODE Synkronus server
- Formulus mobile app
- Google Maps API key (included)

## Technical Notes

- Uses Google Maps JavaScript API
- Responsive CSS with modern design
- GPS coordinates auto-populated from map selection
- Follows ODE v1.0 custom_app tutorial structure
