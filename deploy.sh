#!/bin/bash

# RentFreely ODE Bundle Deployment Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/app"
BUNDLE_DIR="$SCRIPT_DIR/bundle"
BUNDLE_FILE="$BUNDLE_DIR/bundle.zip"

echo "🏠 RentFreely: Building ODE bundle..."

# Clean and build
cd "$APP_DIR"
echo "📦 Installing dependencies..."
npm ci

echo "🔨 Building app..."
npm run build

# Create bundle directory
mkdir -p "$BUNDLE_DIR"

# Create bundle ZIP
echo "📋 Creating bundle ZIP..."
cd "$APP_DIR/dist"
zip -r "$BUNDLE_FILE" .

# Add forms if they exist
if [ -d "$SCRIPT_DIR/forms" ]; then
  echo "📄 Adding forms..."
  cd "$SCRIPT_DIR"
  zip -ur "$BUNDLE_FILE" forms/
fi

echo "✅ Bundle created: $BUNDLE_FILE"

# Upload to Synkronus (if synk CLI is available)
if command -v synk &> /dev/null; then
  echo "📤 Uploading to Synkronus..."
  synk app-bundle push "$BUNDLE_FILE"
  echo "✅ Uploaded successfully"
else
  echo "⚠️  synk CLI not found. Please upload manually:"
  echo "   synk app-bundle push $BUNDLE_FILE"
fi

echo "🎉 RentFreely bundle ready!"
