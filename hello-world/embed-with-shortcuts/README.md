# Hello World Embed with Shortcuts App

An iFrame app demonstrating dynamic parameter passing with shortcuts support.

## Overview

This example shows how to create an embeddable Pitcher app that can receive and pass parameters dynamically through iFrames, while also supporting shortcuts. It's particularly useful for integrating external content (like Wikipedia) with interactive capabilities.

## Features

- iFrame embedding with parameter passing
- DSR module integration
- shortcuts for viewing modes:
  - Fullscreen mode shortcuts
  - Presentation mode shortcuts
- Dynamic content loading
- Menu UI provider integration

## Files

- `app.json`: Application configuration with embed and shortcuts settings
- `index.html`: Main application entry point with iFrame handling
- `thumbnail.webp`: Application preview image

## Configuration

### Canvas Module
- **Enabled**: Yes
- **Auto Install**: False
- **Default Dimensions**: 100% width, 1000px height

### Shortcuts Configuration
The app registers shortcuts for two viewing modes:
- **Fullscreen Mode**: Enhanced viewing experience
- **Presentation Mode**: Optimized for presentations

Each shortcut includes:
- ID: iframe-passer
- Icon: fas fa-cat-space
- Order override: 200

## Getting Started

1. Review the `app.json` configuration for embed settings
2. Customize the iFrame source and parameters in `index.html`
3. Implement parameter passing logic
4. Publish using the Pitcher CLI:
   ```bash
   p publish-app --api-key [YOURAPIKEY] --increment-version --org [YOURORG]
   ```

## iFrame Integration

This app demonstrates how to:
- Embed external content via iFrames
- Pass parameters dynamically between the parent and embedded content
- Handle shortcuts while maintaining iFrame focus
- Integrate with external services (e.g., Wikipedia)