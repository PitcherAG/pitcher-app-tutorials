# Canvas Header Overview

A tutorial example showing how to build an embedded Canvas app using the Pitcher JS API.

## Overview

This app demonstrates:

- Using `@pitcher/js-api` to access the Pitcher environment
- Building a Canvas-embedded app with responsive layout
- Interfacing with the parent Canvas via `postMessage`
- Dynamically theming with instance colors

## Quick Start

### 1. Install Pitcher CLI

```bash
npm install -g @pitcher/cli-scripts
```

### 2. Publish to Your Organization

```bash
cd canvas-header-overview
p publish-app --api-key YOUR_API_KEY --increment-version --org YOUR_ORG
```

Where:

- `YOUR_ORG` is your subdomain (e.g., `demo` for `demo.my.pitcher.com`)
- `YOUR_API_KEY` is from `YOUR_ORG.my.pitcher.com/admin` under API Keys

---

## Using the Pitcher JS API

### Installation

For runtime apps, include via CDN in your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/@pitcher/js-api"></script>
```

For projects with a build step:

```bash
npm install @pitcher/js-api # or yarn, pnpm, etc
```

### Basic Usage

```javascript
// The API is available globally as `pitcher`
const api = pitcher.useApi();

// Get environment info
const env = await api.getEnv();
// env.mode         - 'IOS' | 'ANDROID' | 'WEB'
// env.platform     - 'impact' | 'admin'
// env.pitcher.user - { id, first_name, last_name, ... }
// env.pitcher.accessToken - for REST API calls
// env.pitcher.apiOrigin   - API base URL
// env.instance_color      - theme color (e.g., "#0057B8")
```

### Common API Methods

```javascript
const api = pitcher.useApi();

// Toast notifications
api.toast({ message: "Saved!", type: "success", duration: 3000 });

// Open a file
await api.open({ fileId: "file-123" });
```

### UI API for Canvas Apps

For canvas-embedded apps, use `useUi()` for lifecycle events and canvas updates:

```javascript
const uiApi = pitcher.useUi();

// Notify the platform your app is ready
uiApi.appLoaded();

// Receive initial data (canvas context, edit mode, etc.)
await uiApi.onAppSetData((data) => {
  window.pitcherData = data;
  const isEditMode = data.is_edit_mode;
  const canvasContext = data.canvas?.context; // Your persisted data
});

// Listen for mode changes (edit <-> present)
await uiApi.onAppUpdateData((data) => {
  if (data.is_edit_mode !== undefined) {
    // Mode changed
  }
});

// Listen for canvas updates
await uiApi.onCanvasUpdated((data) => {
  // Canvas was updated externally
});

// Save data to canvas context
await uiApi.updateCanvas({
  id: window.pitcherData.canvas.id,
  context: { myData: "value" },
});
```

For full API reference, see the [JS API documentation](https://developer.pitcher.com/reference/js-api.html).

### Adjust Iframe Height

Canvas iframes can resize to fit content:

```javascript
function updateIframeHeight() {
  const height = document.body.scrollHeight;
  const iframe = window.parent.document.querySelector(
    'iframe[data-app="your-app-name"]'
  );
  if (iframe?.parentElement) {
    iframe.parentElement.style.height = height + "px";
  }
}
```

---

## App Configuration (app.json)

```json
{
  "name": "canvas-header-overview",
  "type": "web",
  "version": "1.0.0",
  "description": "Canvas builder header with stats overview",
  "display_name": "Canvas Header Overview",
  "module": {
    "canvas": {
      "enabled": true,
      "auto_install": false,
      "defaults": {
        "dimensions": {
          "width": "100%",
          "height": "768px"
        }
      }
    }
  },
  "icon": "fas fa-chart-line"
}
```

### Key Fields

| Field                               | Description                                  |
| ----------------------------------- | -------------------------------------------- |
| `name`                              | Unique identifier (change before publishing) |
| `type`                              | `"web"` for HTML/JS apps                     |
| `module.canvas.enabled`             | `true` to allow embedding in Canvas          |
| `module.canvas.defaults.dimensions` | Default size when added to Canvas            |
| `icon`                              | Font Awesome icon class                      |

---

## Publishing with CLI

```bash
# Basic publish
p publish-app --api-key KEY --org ORG

# With version increment
p publish-app --api-key KEY --org ORG --increment-version

# Dry run first
p publish-app --api-key KEY --org ORG --dry-run

# Using environment variable for API key
export NG_API_KEY=myapikey
p publish-app --org demo --increment-version
```

---

## Project Structure

```
canvas-header-overview/
├── app.json      # App configuration
├── index.html    # Entry point
├── main.js       # Application logic
├── styles.css    # Custom styles
└── README.md     # This file
```

---

## Resources

- [JS API Reference](https://developer.pitcher.com/reference/js-api.html)
- [JS API npm](https://www.npmjs.com/package/@pitcher/js-api)
- [CLI Scripts npm](https://www.npmjs.com/package/@pitcher/cli-scripts)
- [Developer Portal](https://developer.pitcher.com)
