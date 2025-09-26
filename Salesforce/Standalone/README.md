# Salesforce Standalone App

A standalone Pitcher application demonstrating Salesforce CRM integration.

## Overview

This example shows how to integrate Pitcher applications with Salesforce, enabling access to Salesforce data, objects, and APIs within your Pitcher app environment.

## Features

- Salesforce API integration
- SOQL query execution
- Salesforce object manipulation
- Authentication handling
- Data synchronization capabilities

## Files

- `app.json`: Application configuration
- `index.html`: Main application with Salesforce integration
- `thumbnail.webp`: Application preview image

## Salesforce Integration

This app demonstrates:
- Connecting to Salesforce instances
- Querying Salesforce objects (Accounts, Contacts, Opportunities, etc.)
- Creating and updating Salesforce records
- Handling Salesforce authentication
- Real-time data synchronization

## API Operations

Key Salesforce operations covered:
- **SOQL Queries**: Retrieve data from Salesforce
- **CRUD Operations**: Create, Read, Update, Delete records
- **Bulk Operations**: Handle large data sets efficiently
- **Metadata API**: Access Salesforce configuration
- **REST API**: Standard Salesforce REST endpoints

## Getting Started

1. Configure Salesforce connection settings
2. Set up authentication credentials
3. Review the integration examples in `index.html`
4. Customize queries and operations for your needs
5. Publish using the Pitcher CLI:
   ```bash
   p publish-app --api-key [YOURAPIKEY] --increment-version --org [YOURORG]
   ```

## Configuration Requirements

- Salesforce Connected App setup
- OAuth configuration
- API access permissions
- Field-level security settings

## Best Practices

- Cache frequently accessed Salesforce data
- Implement proper error handling for API limits
- Use bulk APIs for large data operations
- Follow Salesforce governor limits
- Implement retry logic for transient failures
- Secure credential storage and handling