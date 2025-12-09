# Pitcher API Tutorial: Building Your First Apps

This repository contains example code samples for developers building their first applications with the Pitcher API.

## Getting Started

These examples demonstrate common usage patterns for the Pitcher API, from basic "Hello World" applications to more complex entity interactions and Salesforce integrations.

## API Documentation

Full API documentation is available at: [Pitcher API Documentation](https://pitcherag.github.io/canvas-ui/functions/_internal_.createHighLevelApi.html#createHighLevelApi.__type.shareCanvas.shareCanvas-1)

## Examples

### Hello World Examples

Basic examples showing how to initialize a Pitcher app in different contexts:

- **[Standalone](hello-world/standalone/)**: Simple independent application
- **[Admin](hello-world/admin/)**: Example for admin panel integration
- **[Canvas](hello-world/canvas/)**: Embedded within Canvas UI
- **[Canvas with Shortcuts](hello-world/canvas-with-shortcuts/)**: Pitchdeck app with shortcuts support
- **[Embed with Shortcuts](hello-world/embed-with-shortcuts/)**: iFrame App with Dynamic Parameter passing with shortcuts support
- **[Popup](hello-world/popup/)**: Popup-based application

### Entity Examples

Examples demonstrating how to work with Pitcher entities:

- **[Standalone](Entities/Standalone/)**: Working with entities in standalone mode

### Salesforce Integration

Examples showing how to integrate with Salesforce:

- **[Standalone](Salesforce/Standalone/)**: Salesforce integration in standalone mode

### Multimedia Selector Apps

Examples for multimedia and content selection:

- **[Content Selector](multimedia-selector-apps/content-selector/)**: Content selection interface

### Canvas Embedded Apps

Examples for building apps embedded in Canvas:

- **[Canvas Header Overview](canvas-header-overview/)**: Dashboard with goals, cycle plan, and communication updates. Demonstrates JS API usage, Canvas communication via js api events, and dynamic theming.

### Web File Apps

Examples for web file applications:

- **[SFDC Querying in Web File](web-file-apps/sfdc-quering-in-web-file/)**: Salesforce data querying within web files
- **[Simple SFDC and Call Data in Web File](web-file-apps/simple-sfdc-and-call-data-in-web-file/)**: Combining Salesforce and call data

## Project Structure

Each example includes:

- `app.json`: Configuration file for the application
- `index.html`: Main entry point for the application
- `thumbnail.webp`: Preview image
- `README.md`: Example-specific documentation

## Development Guide

**Important:** Developers should change the app identifier (name) field in the `app.json` file before publishing their applications.

## Publishing Apps

### Using Pitcher CLI

You can easily publish your Pitcher apps using the `@pitcher/cli-scripts` package. This tool simplifies the process of building, validating, and publishing your applications.

1. Install the CLI tool:

   ```bash
   npm install -g @pitcher/cli-scripts
   ```

   This installs the `p` command line tool.

2. Navigate to your app directory (containing app.json)

3. Publish your app:

   ```bash
   p publish-app --api-key [YOURAPIKEY] --increment-version --org [YOURORG]
   ```

   Where `YOURORG` is your organization's specific subdomain. E.g. YOURORG.my.pitcher.com
   and `YOURAPIKEY` is your generated API key from YOURORG.my.pitcher.com/admin

For detailed information about all available commands and options, visit:
[Pitcher CLI Documentation](https://www.npmjs.com/package/@pitcher/cli-scripts)

## Additional Resources

- [Pitcher Developer Portal](https://developer.pitcher.com)
- [Pitcher JavaScript API Documentation](https://www.npmjs.com/package/@pitcher/js-api)
- [Pitcher CLI Scripts](https://www.npmjs.com/package/@pitcher/cli-scripts)
