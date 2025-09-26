# Hello World Admin App

A Pitcher application example designed for admin panel integration.

## Overview

This example demonstrates how to create a Pitcher app that integrates with the admin panel interface. It shows the configuration required for admin-specific features and modules.

## Features

- Admin panel integration
- Admin instance module enabled
- Menu UI provider integration
- Admin-specific configuration

## Files

- `app.json`: Application configuration with admin module settings
- `index.html`: Main application entry point
- `thumbnail.webp`: Application preview image

## Configuration

The app includes admin-specific configuration with the `admin_instance` module enabled. This allows the app to run within the admin panel context with appropriate permissions and access.

## Getting Started

1. Review the `app.json` configuration, noting the admin module settings
2. Customize the app name and display name for your organization
3. Implement your admin-specific logic in `index.html`
4. Publish using the Pitcher CLI:
   ```bash
   p publish-app --api-key [YOURAPIKEY] --increment-version --org [YOURORG]
   ```

## Admin Module

The `admin_instance` module is enabled in this app, allowing it to access admin-specific features and functionality within the Pitcher platform.