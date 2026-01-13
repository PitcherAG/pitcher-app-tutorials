# Canvas Sales Dashboard

A Pitcher canvas app that displays sales reports.

## Setup

```bash
npm install
```

## Dev Sync

To sync the app to the Pitcher dev environment, run two commands in separate terminals:

**Terminal 1** - To build and watch run in `vite-app-example` folder:

```bash
npm i && npm run watch
```

**Terminal 2** - To sync to Pitcher run in `dist` folder:

```bash
p dev-sync watch --file-id 01KEVB49SR2VZAMRZR19RWF69P --api-key yourapikey
```

## Build

```bash
npm run build
```

## Publish

```bash
p publish-app --api-key YOUR_KEY --org YOUR_ORG --increment-version
```
