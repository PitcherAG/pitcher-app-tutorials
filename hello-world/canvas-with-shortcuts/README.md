# Hello World Canvas with Shortcuts App

A Pitchdeck app demonstrating Canvas integration with shortcuts support.

## Overview

This example extends the basic Canvas app by adding shortcuts for different view modes (edit, fullscreen, and presentation). It's perfect for creating interactive presentations that support quick navigation and mode switching.

## Features

- Canvas UI embedding with shortcuts
- DSR module integration
- shortcuts for multiple modes:
  - Edit mode shortcuts
  - Fullscreen mode shortcuts
  - Presentation mode shortcuts
- Configurable dimensions
- Menu UI provider integration

## Files

- `app.json`: Application configuration with shortcuts definitions
- `index.html`: Main application entry point
- `thumbnail.webp`: Application preview image

## Configuration

### Canvas Module
- **Enabled**: Yes
- **Auto Install**: False
- **Default Dimensions**: 100% width, 1000px height

### Shortcuts Configuration
The app registers shortcuts for three different modes:
- **Edit Mode**: Available during content editing
- **Fullscreen Mode**: Available in fullscreen view
- **Presentation Mode**: Available during presentations

Each shortcut includes:
- Unique ID
- Icon (fas fa-window-maximize)
- Order override for positioning

## Getting Started

1. Review the `app.json` configuration, especially the shortcuts section
2. Customize shortcuts and their order as needed
3. Implement shortcut handling logic in `index.html`
4. Publish using the Pitcher CLI:
   ```bash
   p publish-app --api-key [YOURAPIKEY] --increment-version --org [YOURORG]
   ```

## Shortcuts Implementation

The app demonstrates how to register and handle shortcuts in different Canvas modes, enhancing user experience with quick actions and navigation.