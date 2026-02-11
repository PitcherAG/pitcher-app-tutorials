# Pitcher JS API Demo — List & Open Files

Minimal, self-contained HTML demo showing how to list, open, and select files via the Pitcher JS API.
Open `index3.html` inside Pitcher (Impact Web or iOS) to see it in action.

## What it does

1. **Initializes** the SDK with `pitcher.useApi()` and reads the environment
2. **Lists files** from the current instance via `api.getFiles()`
3. **Opens a file** in Pitcher's native viewer when clicked via `api.open()`
4. **Selects a file** via the native Pitcher content picker modal via `api.selectContent()`

The page has three sections: a code reference, a live file list, and a content selector button.

## API at a glance

```js
const api = pitcher.useApi()
const env = await api.getEnv()

const { results, count } = await api.getFiles({
  instance_id: env.pitcher.instance.id,
  page_size: 10
})

api.open({ fileId: file.id })

const { user_action, content } = await api.selectContent()
```

`getFiles()` returns a paginated response — `results` is the array of files, `count` is the total available. `open()` tells Pitcher to display the file in its built-in viewer (video player, PDF reader, web view, etc.). `selectContent()` opens the native Pitcher file picker modal and returns the user's selection.

## `getFiles` parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `instance_id` | `string` | Instance to query (from `env.pitcher.instance.id`) |
| `page_size` | `number` | Max results per page |
| `type` | `string \| string[]` | Filter by type: `'content'`, `'video'`, `'image'`, `'document'` |
| `content_type` | `string \| string[]` | Filter by content type |

## `open` parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `fileId` | `string` | ID of the file to open |
| `pageIndex` | `number` | Open at a specific page |
| `startTime` | `number` | Start time in seconds (video) |
| `newTab` | `boolean` | Open in a new tab |

## `selectContent` parameters

All optional. Call with no arguments to open a generic file picker.

| Parameter | Type | Description |
|-----------|------|-------------|
| `selections` | `Selection[]` | Pre-select specific files/pages |
| `max_selections` | `number` | Limit how many items can be selected |
| `allowed_content_types` | `string[]` | Restrict to specific content types |
| `allowed_original_extensions` | `string[]` | Restrict to specific file extensions |

Returns `{ user_action, content }` where `user_action` is `'selected'` or `'cancelled'`, and `content` is an array of selected items with `id`, `name`, `type`, and optional `page_index`.

## Requirements

- Must be opened **inside Pitcher** (Impact Web or iOS) — the SDK communicates with the host app via `postMessage`
- The JS API is loaded from CDN: `https://cdn.jsdelivr.net/npm/@pitcher/js-api`
