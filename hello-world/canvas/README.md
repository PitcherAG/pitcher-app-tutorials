# Hello World Canvas App

A Pitcher application example designed to be embedded within the Canvas UI.

## Overview

This example demonstrates how to create a Pitcher app that integrates seamlessly with the Canvas interface, supporting canvas-specific features and DSR (Digital Sales Room) capabilities.

## Features

- Canvas UI embedding
- DSR module integration
- Configurable dimensions
- Menu UI provider integration
- Auto-install configuration

## Files

- `app.json`: Application configuration with canvas module settings
- `index.html`: Main application entry point
- `thumbnail.webp`: Application preview image

## Configuration

### Canvas Module
- **Enabled**: Yes
- **Auto Install**: False
- **Default Dimensions**: 100% width, 1000px height

### DSR Module
The DSR (Digital Sales Room) module is enabled for enhanced sales presentation capabilities.

## Getting Started

1. Review the `app.json` configuration, noting the canvas and DSR module settings
2. Customize the app name, display name, and dimensions for your needs
3. Implement your canvas-specific logic in `index.html`
4. Publish using the Pitcher CLI:
   ```bash
   p publish-app --api-key [YOURAPIKEY] --increment-version --org [YOURORG]
   ```

## Canvas Integration

This app is configured to run within the Canvas environment with predefined dimensions and DSR support, making it ideal for sales presentations and interactive content.