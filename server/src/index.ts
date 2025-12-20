import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple paths to find .env file
const possibleEnvPaths = [
  path.join(process.cwd(), '.env'),                    // Project root (npm workspace)
  path.join(__dirname, '..', '..', '.env'),            // From src folder
  path.join(process.cwd(), '..', '.env'),              // Up from server folder
];

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`Loading .env from: ${envPath}`);
    dotenv.config({ path: envPath });
    break;
  }
}

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  validateConfig,
  getAuthUrl,
  handleOAuthCallback,
  isAuthenticated,
  getUserEmail,
} from './google-auth.js';
import {
  getPendingInvites,
  respondToInvite,
} from './calendar-service.js';
import { handleMCPRequest } from './mcp-server.js';
import { deleteTokens } from './token-store.js';
import {
  validateClientCredentials,
  generateAccessToken,
  validateAccessToken,
  extractBearerToken,
  getTokenResponse,
  getOAuthCredentials,
} from './mcp-oauth.js';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Default user ID for single-user demo
const DEFAULT_USER_ID = 'default';

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? true // Allow all origins in production (served from same domain)
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ============================================
// Health Check
// ============================================
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================
// Authentication Routes
// ============================================

// Get auth status
app.get('/auth/status', (_req: Request, res: Response) => {
  const userId = DEFAULT_USER_ID;
  const authenticated = isAuthenticated(userId);
  
  if (authenticated) {
    res.json({
      authenticated: true,
      email: getUserEmail(userId),
    });
  } else {
    res.json({
      authenticated: false,
      authUrl: getAuthUrl(userId),
    });
  }
});

// Initiate Google OAuth flow
app.get('/auth/google', (_req: Request, res: Response) => {
  const userId = DEFAULT_USER_ID;
  const authUrl = getAuthUrl(userId);
  res.redirect(authUrl);
});

// OAuth callback handler
app.get('/oauth/callback', async (req: Request, res: Response) => {
  const { code, error } = req.query;
  const userId = DEFAULT_USER_ID;

  if (error) {
    console.error('OAuth error:', error);
    return res.redirect('/?error=oauth_error');
  }

  if (!code || typeof code !== 'string') {
    return res.redirect('/?error=no_code');
  }

  try {
    const { email } = await handleOAuthCallback(code, userId);
    console.log(`Successfully authenticated user: ${email}`);
    
    // Redirect to the app UI
    res.redirect('/?auth=success');
  } catch (err: any) {
    console.error('OAuth callback error:', err);
    res.redirect(`/?error=auth_failed&message=${encodeURIComponent(err.message)}`);
  }
});

// Logout
app.post('/auth/logout', (_req: Request, res: Response) => {
  const userId = DEFAULT_USER_ID;
  deleteTokens(userId);
  res.json({ success: true, message: 'Logged out successfully' });
});

// ============================================
// API Routes
// ============================================

// Get pending invites
app.get('/api/pending-invites', async (req: Request, res: Response) => {
  const userId = DEFAULT_USER_ID;
  const { start_date, end_date } = req.query;

  if (!isAuthenticated(userId)) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
      authUrl: getAuthUrl(userId),
    });
  }

  try {
    const invites = await getPendingInvites(
      userId,
      start_date as string | undefined,
      end_date as string | undefined
    );
    res.json({ success: true, data: invites });
  } catch (err: any) {
    console.error('Error fetching invites:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Respond to an invite
app.post('/api/respond', async (req: Request, res: Response) => {
  const userId = DEFAULT_USER_ID;
  const { eventId, response } = req.body;

  if (!isAuthenticated(userId)) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
      authUrl: getAuthUrl(userId),
    });
  }

  if (!eventId || !response) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: eventId, response',
    });
  }

  if (!['accepted', 'declined', 'tentative'].includes(response)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid response. Must be: accepted, declined, or tentative',
    });
  }

  try {
    const result = await respondToInvite(userId, eventId, response);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Error responding to invite:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// OAuth 2.0 Discovery Endpoints (Required by ChatGPT)
// ============================================

// Get the base URL for this server
function getBaseUrl(req: Request): string {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${protocol}://${host}`;
}

// OAuth 2.0 Authorization Server Metadata
app.get('/.well-known/oauth-authorization-server', (req: Request, res: Response) => {
  const baseUrl = getBaseUrl(req);
  
  res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    grant_types_supported: ['client_credentials', 'authorization_code'],
    response_types_supported: ['code'],
    scopes_supported: ['mcp'],
    code_challenge_methods_supported: ['S256'],
  });
});

// OpenID Connect Discovery
app.get('/.well-known/openid-configuration', (req: Request, res: Response) => {
  const baseUrl = getBaseUrl(req);
  
  res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    grant_types_supported: ['client_credentials', 'authorization_code'],
    response_types_supported: ['code'],
    scopes_supported: ['openid', 'mcp'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    code_challenge_methods_supported: ['S256'],
  });
});

// OAuth Authorization Endpoint (for authorization code flow)
app.get('/oauth/authorize', (req: Request, res: Response) => {
  const { client_id, redirect_uri, response_type, state, code_challenge, code_challenge_method } = req.query;
  
  // For client_credentials, we auto-approve and redirect with a code
  const { clientId } = getOAuthCredentials();
  
  if (client_id !== clientId) {
    return res.status(400).json({ error: 'invalid_client' });
  }
  
  if (response_type !== 'code') {
    return res.status(400).json({ error: 'unsupported_response_type' });
  }
  
  // Generate authorization code
  const authCode = generateAccessToken(clientId); // Reusing token generator for simplicity
  
  // Store code challenge for PKCE verification (simplified - in production use proper storage)
  if (code_challenge) {
    // Store for later verification - simplified implementation
    (global as any).__pkce_challenges = (global as any).__pkce_challenges || {};
    (global as any).__pkce_challenges[authCode] = { code_challenge, code_challenge_method };
  }
  
  // Redirect back with code
  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.set('code', authCode);
  if (state) {
    redirectUrl.searchParams.set('state', state as string);
  }
  
  res.redirect(redirectUrl.toString());
});

// ============================================
// MCP OAuth Token Endpoint (for ChatGPT authentication)
// ============================================
app.post('/oauth/token', (req: Request, res: Response) => {
  const { grant_type, client_id, client_secret, code, redirect_uri, code_verifier } = req.body;

  // Also check Authorization header for client credentials
  let authClientId = client_id;
  let authClientSecret = client_secret;
  
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.slice(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [headerClientId, headerClientSecret] = credentials.split(':');
    authClientId = authClientId || headerClientId;
    authClientSecret = authClientSecret || headerClientSecret;
  }

  // Handle authorization_code grant type
  if (grant_type === 'authorization_code') {
    if (!code) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing authorization code',
      });
    }
    
    // Verify the code is valid (we stored it as a token)
    if (!validateAccessToken(code)) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid or expired authorization code',
      });
    }
    
    // Generate new access token
    const accessToken = generateAccessToken(authClientId || 'chatgpt');
    const tokenResponse = getTokenResponse(accessToken);
    
    console.log('OAuth token issued via authorization_code for client:', authClientId);
    res.json(tokenResponse);
    return;
  }

  // Handle client_credentials grant type
  if (grant_type === 'client_credentials') {
    // Validate client credentials
    if (!validateClientCredentials(authClientId, authClientSecret)) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials',
      });
    }

    // Generate and return access token
    const accessToken = generateAccessToken(authClientId);
    const tokenResponse = getTokenResponse(accessToken);
    
    console.log('OAuth token issued via client_credentials for client:', authClientId);
    res.json(tokenResponse);
    return;
  }

  // Unsupported grant type
  return res.status(400).json({
    error: 'unsupported_grant_type',
    error_description: 'Supported grant types: client_credentials, authorization_code',
  });
});

// Endpoint to get OAuth credentials info (for setup)
app.get('/oauth/credentials', (_req: Request, res: Response) => {
  const { clientId } = getOAuthCredentials();
  res.json({
    message: 'Use these credentials in ChatGPT app configuration',
    client_id: clientId,
    note: 'Client secret is configured via MCP_OAUTH_CLIENT_SECRET env var',
  });
});

// ============================================
// MCP Protocol Endpoint (OAuth protected)
// ============================================
app.post('/mcp', async (req: Request, res: Response) => {
  // Validate OAuth token
  const token = extractBearerToken(req.headers.authorization);
  
  if (!token || !validateAccessToken(token)) {
    return res.status(401).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Unauthorized: Invalid or missing access token' },
      id: req.body.id || null,
    });
  }

  const { method, params } = req.body;
  const userId = DEFAULT_USER_ID;

  if (!method) {
    return res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Invalid request: missing method' },
      id: req.body.id || null,
    });
  }

  try {
    const result = await handleMCPRequest(method, params || {}, userId);
    res.json({
      jsonrpc: '2.0',
      result,
      id: req.body.id || null,
    });
  } catch (err: any) {
    console.error('MCP error:', err);
    res.json({
      jsonrpc: '2.0',
      error: { code: -32603, message: err.message },
      id: req.body.id || null,
    });
  }
});

// ============================================
// Static File Serving (Production)
// ============================================
if (process.env.NODE_ENV === 'production') {
  // Serve React build
  const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDistPath));
  
  // Handle SPA routing - serve index.html for all non-API routes
  app.get('*', (req: Request, res: Response) => {
    // Don't serve index.html for API/auth routes
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/auth') ||
      req.path.startsWith('/oauth') ||
      req.path.startsWith('/mcp') ||
      req.path === '/health'
    ) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// ============================================
// Error Handler
// ============================================
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});

// ============================================
// Start Server
// ============================================
function startServer(): void {
  // Validate configuration
  if (!validateConfig()) {
    console.error('Invalid configuration. Please check environment variables.');
    process.exit(1);
  }

  const { clientId, clientSecret } = getOAuthCredentials();
  
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║     ChatGPT Reservations Manager Server                   ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                  ║
║  Environment: ${process.env.NODE_ENV || 'development'}                             ║
╠═══════════════════════════════════════════════════════════╣
║  MCP OAuth Credentials (for ChatGPT):                     ║
║    Client ID: ${clientId.padEnd(40)}║
║    Client Secret: ${clientSecret.padEnd(36)}║
╠═══════════════════════════════════════════════════════════╣
║  Endpoints:                                               ║
║    GET  /.well-known/oauth-authorization-server           ║
║    GET  /.well-known/openid-configuration                 ║
║    GET  /oauth/authorize - OAuth authorization            ║
║    POST /oauth/token     - OAuth token (ChatGPT)          ║
║    POST /mcp             - MCP protocol (OAuth protected) ║
║    GET  /health          - Health check                   ║
║    GET  /auth/status     - Check auth status              ║
║    GET  /auth/google     - Start Google OAuth             ║
║    GET  /oauth/callback  - Google OAuth callback          ║
║    POST /auth/logout     - Logout                         ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

startServer();

