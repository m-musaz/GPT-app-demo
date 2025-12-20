# ChatGPT Reservations Manager

A ChatGPT app that helps you manage pending Google Calendar invitations directly from within ChatGPT conversations. Built using OpenAI's Apps SDK with the Model Context Protocol (MCP).

## Features

- View pending calendar invitations you haven't responded to
- Accept, decline, or mark invitations as tentative with one click
- Natural language interaction within ChatGPT
- Secure OAuth 2.0 authentication with Google Calendar

## Prerequisites

- Node.js 18+
- A Google Cloud project with Calendar API enabled
- Railway account (for deployment)
- ChatGPT Plus account (for testing the app)

## Environment Variables

Create a `.env` file in the root directory:

```env
# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback

# Server Configuration
PORT=3000
NODE_ENV=development
SESSION_SECRET=your_random_session_secret_here
```

---

## Google Cloud Project Setup

Follow these steps to set up Google Calendar API access:

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "ChatGPT Reservations Manager")
5. Click "Create"
6. Wait for the project to be created and select it

### Step 2: Enable Google Calendar API

1. In the left sidebar, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on "Google Calendar API"
4. Click "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have a Google Workspace org)
3. Click "Create"
4. Fill in the required fields:
   - **App name**: ChatGPT Reservations Manager
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click "Save and Continue"
6. On the "Scopes" page, click "Add or Remove Scopes"
7. Add the following scopes:
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.readonly`
8. Click "Update" then "Save and Continue"
9. On "Test users" page, add your Google account email
10. Click "Save and Continue"

### Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Enter a name (e.g., "ChatGPT Reservations Manager Web Client")
5. Under "Authorized JavaScript origins", add:
   - `http://localhost:3000` (for development)
   - `https://your-app.railway.app` (for production - add later)
6. Under "Authorized redirect URIs", add:
   - `http://localhost:3000/oauth/callback` (for development)
   - `https://your-app.railway.app/oauth/callback` (for production - add later)
7. Click "Create"
8. Copy the **Client ID** and **Client Secret**
9. Add them to your `.env` file

### Step 5: Publish the App (for production)

When ready for production:
1. Go to "OAuth consent screen"
2. Click "Publish App"
3. Confirm the publication

> **Note**: While in testing mode, only users listed as "Test users" can authenticate.

---

## Local Development

### Installation

```bash
# Install dependencies
npm install

# Run both server and client in development mode
npm run dev
```

The server will run on `http://localhost:3000` and the client on `http://localhost:5173`.

### Development Commands

```bash
# Run server only
npm run dev:server

# Run client only
npm run dev:client

# Build for production
npm run build

# Start production server
npm run start
```

---

## Railway Deployment

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy to Railway

1. Go to [Railway](https://railway.app/)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account and select this repository
5. Railway will auto-detect the configuration from `railway.json`

### Step 3: Configure Environment Variables

In Railway dashboard:
1. Go to your project's Variables tab
2. Add all environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (set to `https://your-app.railway.app/oauth/callback`)
   - `PORT` (set to `3000`)
   - `NODE_ENV` (set to `production`)
   - `SESSION_SECRET` (generate a random string)

### Step 4: Update Google OAuth Settings

1. Go back to Google Cloud Console > Credentials
2. Edit your OAuth client
3. Add your Railway URL to:
   - Authorized JavaScript origins: `https://your-app.railway.app`
   - Authorized redirect URIs: `https://your-app.railway.app/oauth/callback`

---

## ChatGPT App Integration

### Register Your App

1. Open ChatGPT and go to Settings
2. Enable Developer Mode (if available)
3. Create a new app with these settings:
   - **Name**: Reservations Manager
   - **Description**: Manage your pending Google Calendar invitations
   - **MCP Server URL**: `https://your-app.railway.app/mcp`

### Test Commands

Try these natural language commands in ChatGPT:

- "Show me my pending calendar invites"
- "What meetings haven't I responded to?"
- "Accept the meeting with [person name]"
- "Decline all meetings on Friday"
- "Mark the team standup as tentative"

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/auth/google` | GET | Initiate OAuth flow |
| `/oauth/callback` | GET | OAuth callback handler |
| `/api/pending-invites` | GET | Get pending calendar invites |
| `/api/respond` | POST | Respond to an invite |
| `/mcp` | POST | MCP protocol endpoint |

---

## Project Structure

```
├── package.json           # Root package with workspaces
├── railway.json           # Railway deployment config
├── server/                # Backend MCP server
│   ├── src/
│   │   ├── index.ts           # Express server entry
│   │   ├── mcp-server.ts      # MCP protocol handler
│   │   ├── google-auth.ts     # OAuth 2.0 logic
│   │   ├── calendar-service.ts # Calendar API
│   │   ├── token-store.ts     # Token persistence
│   │   └── types.ts           # TypeScript types
│   └── package.json
└── client/                # React frontend
    ├── src/
    │   ├── App.tsx            # Main component
    │   ├── components/        # UI components
    │   └── services/          # API client
    └── package.json
```

---

## Troubleshooting

### OAuth Error: "redirect_uri_mismatch"
- Ensure the redirect URI in your `.env` exactly matches what's configured in Google Cloud Console
- Check for trailing slashes

### Calendar API Error: "insufficient permissions"
- Make sure the Calendar API is enabled in your Google Cloud project
- Verify the OAuth consent screen has the correct scopes

### Token Refresh Issues
- Delete the `data/tokens.json` file and re-authenticate

---

## License

MIT

