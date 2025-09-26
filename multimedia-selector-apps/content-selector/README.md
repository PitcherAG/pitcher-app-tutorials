# Content Selector App

A multimedia selector application for choosing content within Canvas multimedia components.

## Overview

This example demonstrates how to create a content selection interface that integrates with Pitcher's Canvas multimedia components. It provides a DAM (Digital Asset Management) selector for managing and selecting various media assets.

## Features

- Multimedia content selection interface
- DAM (Digital Asset Management) integration
- Canvas multimedia component compatibility
- Centered modal presentation
- Fixed dimensions for consistent UI

## Files

- `app.json`: Application configuration with multimedia selector settings
- `index.html`: Main selection interface implementation
- `thumbnail.webp`: Application preview image

## Configuration

### App Type
- **Type**: multimedia-selector
- **Provider**: multimedia_selector

### Display Options
- **Dimensions**:
  - Width: 900px
  - Height: 600px
- **Placement**: center
- **Icon**: far fa-clipboard-check

## Multimedia Selection

This app enables:
- Browse and search media assets
- Preview content before selection
- Filter by media type (images, videos, documents)
- Select multiple items
- Return selected content to Canvas components

## Integration with Canvas

The selector integrates with Canvas multimedia components:
- Image galleries
- Video players
- Document viewers
- Media carousels
- Content placeholders

## Getting Started

1. Review the `app.json` configuration
2. Customize the selection interface in `index.html`
3. Implement your media source integration
4. Configure filtering and search options
5. Publish using the Pitcher CLI:
   ```bash
   p publish-app --api-key [YOURAPIKEY] --increment-version --org [YOURORG]
   ```

## API Integration

The app can connect to:
- Internal DAM systems
- Cloud storage providers
- Content management systems
- Media libraries
- External asset repositories

## Best Practices

- Implement efficient thumbnail generation
- Add search and filtering capabilities
- Support multiple file formats
- Provide clear preview functionality
- Handle large asset libraries efficiently
- Include metadata display
- Implement proper error handling for failed uploads