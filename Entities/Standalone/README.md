# Entities Standalone App

A standalone Pitcher application demonstrating entity management and data operations.

## Overview

This example shows how to work with Pitcher entities in a standalone application context. It demonstrates CRUD operations, entity relationships, and data management patterns using the Pitcher API.

## Features

- Entity creation, reading, updating, and deletion
- Standalone deployment
- Yacht provider integration
- Menu UI provider integration
- Entity relationship handling

## Files

- `app.json`: Application configuration
- `index.html`: Main application with entity operations
- `thumbnail.webp`: Application preview image

## Configuration

The app is configured with:
- **Providers**: yacht, ui:menu
- **Type**: Web application
- **Display**: Standalone mode

## Entity Operations

This app demonstrates:
- Creating new entities
- Querying and filtering entities
- Updating entity properties
- Deleting entities
- Managing entity relationships
- Working with entity metadata

## Getting Started

1. Review the `app.json` configuration
2. Examine entity operation examples in `index.html`
3. Customize entity schemas for your use case
4. Publish using the Pitcher CLI:
   ```bash
   p publish-app --api-key [YOURAPIKEY] --increment-version --org [YOURORG]
   ```

## API Usage

The app showcases Pitcher Entity API usage including:
- Entity schema definition
- Query building
- Batch operations
- Transaction handling
- Error management

## Best Practices

- Always validate entity data before operations
- Use transactions for multiple related operations
- Implement proper error handling
- Cache frequently accessed entities
- Follow Pitcher entity naming conventions