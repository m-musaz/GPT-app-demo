import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import {
  getPendingInvites,
  respondToInvite,
  formatInvitesAsText,
} from './calendar-service.js';
import { isAuthenticated, getAuthUrl } from './google-auth.js';
import { MCPToolResult } from './types.js';

// Default user ID for single-user mode
const DEFAULT_USER_ID = 'default';

/**
 * Create MCP tool result
 */
function createToolResult(text: string, isError = false): CallToolResult {
  return {
    content: [{ type: 'text', text }],
    isError,
  };
}

/**
 * Define the available MCP tools
 */
const TOOLS: Tool[] = [
  {
    name: 'get_pending_reservations',
    description:
      'Fetch pending calendar invitations that the user has not responded to. Returns a list of events where the user is an attendee but has not accepted, declined, or marked as tentative.',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          description:
            'Start date for the search range in ISO 8601 format (e.g., "2024-01-15T00:00:00Z"). Defaults to now.',
        },
        end_date: {
          type: 'string',
          description:
            'End date for the search range in ISO 8601 format (e.g., "2024-01-30T23:59:59Z"). Defaults to 14 days from now.',
        },
      },
      required: [],
    },
  },
  {
    name: 'respond_to_invite',
    description:
      'Respond to a pending calendar invitation. You can accept, decline, or mark the invitation as tentative.',
    inputSchema: {
      type: 'object',
      properties: {
        event_id: {
          type: 'string',
          description: 'The unique identifier of the calendar event to respond to.',
        },
        response: {
          type: 'string',
          enum: ['accepted', 'declined', 'tentative'],
          description:
            'The response to send: "accepted" to accept the invite, "declined" to decline, or "tentative" to indicate you might attend.',
        },
      },
      required: ['event_id', 'response'],
    },
  },
  {
    name: 'check_auth_status',
    description:
      'Check if the user is authenticated with Google Calendar. Returns authentication status and provides an auth URL if not authenticated.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

/**
 * Handle the get_pending_reservations tool
 */
async function handleGetPendingReservations(
  args: { start_date?: string; end_date?: string },
  userId: string
): Promise<CallToolResult> {
  // Check authentication
  if (!isAuthenticated(userId)) {
    const authUrl = getAuthUrl(userId);
    return createToolResult(
      `You are not authenticated with Google Calendar. Please authenticate first by visiting:\n\n${authUrl}\n\nAfter authentication, try this command again.`,
      true
    );
  }

  try {
    const result = await getPendingInvites(userId, args.start_date, args.end_date);
    
    // Format the response as readable text
    const textResponse = formatInvitesAsText(result.invites);
    
    // Also include JSON data for structured access
    const fullResponse = `${textResponse}\n\n---\n\nRaw data (for reference):\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
    
    return createToolResult(fullResponse);
  } catch (error: any) {
    return createToolResult(`Error fetching pending invites: ${error.message}`, true);
  }
}

/**
 * Handle the respond_to_invite tool
 */
async function handleRespondToInvite(
  args: { event_id: string; response: 'accepted' | 'declined' | 'tentative' },
  userId: string
): Promise<CallToolResult> {
  // Validate arguments
  if (!args.event_id) {
    return createToolResult('Error: event_id is required', true);
  }
  
  if (!['accepted', 'declined', 'tentative'].includes(args.response)) {
    return createToolResult(
      'Error: response must be one of: accepted, declined, tentative',
      true
    );
  }

  // Check authentication
  if (!isAuthenticated(userId)) {
    const authUrl = getAuthUrl(userId);
    return createToolResult(
      `You are not authenticated with Google Calendar. Please authenticate first by visiting:\n\n${authUrl}`,
      true
    );
  }

  try {
    const result = await respondToInvite(userId, args.event_id, args.response);
    
    // Return a friendly message
    return createToolResult(
      `✅ ${result.message}\n\nThe organizer has been notified of your response.`
    );
  } catch (error: any) {
    return createToolResult(`Error responding to invite: ${error.message}`, true);
  }
}

/**
 * Handle the check_auth_status tool
 */
function handleCheckAuthStatus(userId: string): CallToolResult {
  const authenticated = isAuthenticated(userId);
  
  if (authenticated) {
    return createToolResult(
      '✅ You are authenticated with Google Calendar. You can now view and respond to your pending invitations.'
    );
  } else {
    const authUrl = getAuthUrl(userId);
    return createToolResult(
      `❌ You are not authenticated with Google Calendar.\n\nPlease visit the following URL to connect your Google Calendar:\n\n${authUrl}\n\nAfter completing authentication, you'll be able to view and respond to your pending calendar invitations.`
    );
  }
}

/**
 * Create and configure the MCP server
 */
export function createMCPServer(): Server {
  const server = new Server(
    {
      name: 'reservations-manager',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const userId = DEFAULT_USER_ID; // In production, extract from session/context

    switch (name) {
      case 'get_pending_reservations':
        return handleGetPendingReservations(
          args as { start_date?: string; end_date?: string },
          userId
        );

      case 'respond_to_invite':
        return handleRespondToInvite(
          args as { event_id: string; response: 'accepted' | 'declined' | 'tentative' },
          userId
        );

      case 'check_auth_status':
        return handleCheckAuthStatus(userId);

      default:
        return createToolResult(`Unknown tool: ${name}`, true);
    }
  });

  return server;
}

/**
 * Start the MCP server with stdio transport (for CLI usage)
 */
export async function startMCPServerStdio(): Promise<void> {
  const server = createMCPServer();
  const transport = new StdioServerTransport();
  
  await server.connect(transport);
  console.error('MCP Server running on stdio');
}

/**
 * Handle MCP request via HTTP (for web integration)
 * This is a simplified handler for Express integration
 */
export async function handleMCPRequest(
  method: string,
  params: Record<string, unknown>,
  userId: string = DEFAULT_USER_ID
): Promise<unknown> {
  switch (method) {
    case 'tools/list':
      return { tools: TOOLS };

    case 'tools/call': {
      const { name, arguments: args } = params as {
        name: string;
        arguments: Record<string, unknown>;
      };

      switch (name) {
        case 'get_pending_reservations':
          return await handleGetPendingReservations(
            args as { start_date?: string; end_date?: string },
            userId
          );

        case 'respond_to_invite':
          return await handleRespondToInvite(
            args as { event_id: string; response: 'accepted' | 'declined' | 'tentative' },
            userId
          );

        case 'check_auth_status':
          return handleCheckAuthStatus(userId);

        default:
          return createToolResult(`Unknown tool: ${name}`, true);
      }
    }

    default:
      throw new Error(`Unknown MCP method: ${method}`);
  }
}

