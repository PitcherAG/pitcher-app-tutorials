# Hello World Standalone App

A basic standalone Pitcher application demonstrating the fundamental setup and initialization.

## Overview

This example shows how to create a simple standalone Pitcher app that runs independently. It's the perfect starting point for developers new to the Pitcher platform.

## Features

- Basic app initialization
- Standalone deployment configuration
- Menu UI provider integration

## Files

- `app.json`: Application configuration
- `index.html`: Main application entry point
- `thumbnail.webp`: Application preview image

## Configuration

The app is configured as a web-type application with menu UI provider capabilities. See `app.json` for the full configuration details.

## Getting Started

1. Review the `app.json` configuration file
2. Customize the app name and display name for your organization
3. Implement your application logic in `index.html`
4. Publish using the Pitcher CLI:
   ```bash
   p publish-app --api-key [YOURAPIKEY] --increment-version --org [YOURORG]
   ```