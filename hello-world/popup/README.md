# Hello World Popup App

A popup-based Pitcher application with centered placement and responsive dimensions.

## Overview

This example demonstrates how to create a Pitcher app that opens as a popup window, perfect for modal interactions, forms, or focused content presentation without leaving the main interface.

## Features

- Canvas popup application type
- Centered popup placement
- Responsive dimensions (90% viewport width/height)
- Custom icon and ordering
- Lightweight popup interface

## Files

- `app.json`: Application configuration with popup settings
- `index.html`: Main application entry point
- `thumbnail.webp`: Application preview image

## Configuration

### Popup Settings
- **App Type**: canvas-popup
- **Dimensions**:
  - Width: 90vw (90% of viewport width)
  - Height: 90vh (90% of viewport height)
- **Placement**: center
- **Order Override**: 1 (for menu positioning)

## Getting Started

1. Review the `app.json` configuration for popup settings
2. Customize dimensions and placement as needed
3. Implement your popup content in `index.html`
4. Publish using the Pitcher CLI:
   ```bash
   p publish-app --api-key [YOURAPIKEY] --increment-version --org [YOURORG]
   ```

## Use Cases

This popup app pattern is ideal for:
- Quick forms and data entry
- Notifications and alerts
- Media viewers
- Settings panels
- Confirmation dialogs
- Content previews

## Popup Behavior

The app opens in a modal popup window that:
- Centers automatically on the screen
- Scales responsively to viewport size
- Maintains focus until closed
- Overlays the main application content