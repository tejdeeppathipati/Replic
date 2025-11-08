import { Composio } from "@composio/core";

// Initialize Composio client with API key and toolkit versions
export const composioClient = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  // Specify toolkit versions for manual tool execution
  toolkitVersions: {
    twitter: "20251024_00", // Version from Composio Playground
    reddit: "20251024_00",  // Reddit version (same as Twitter)
  },
});

// Auth Config IDs - these should be set in your environment variables
export const AUTH_CONFIGS = {
  TWITTER: process.env.TWITTER_AUTH_CONFIG_ID || "",
  REDDIT: process.env.REDDIT_AUTH_CONFIG_ID || "",
} as const;

// Integration type
export type IntegrationType = "TWITTER" | "REDDIT";

/**
 * Initiates OAuth connection for a user
 * @param userId - Unique identifier for the user (from your database)
 * @param integration - The integration type (TWITTER or REDDIT)
 * @param callbackUrl - URL to redirect after OAuth completion
 * @returns Connection request with redirect URL
 */
export async function initiateConnection(
  userId: string,
  integration: IntegrationType,
  callbackUrl?: string
) {
  const authConfigId = AUTH_CONFIGS[integration];
  
  if (!authConfigId) {
    throw new Error(`Auth config ID not found for ${integration}`);
  }

  console.log(`\n🔗 [CONNECT] Initiating ${integration} connection for user: ${userId}`);
  console.log(`   Auth Config ID: ${authConfigId}`);
  
  // Initiate the connection using the auth config
  const connectionRequest = await composioClient.connectedAccounts.initiate(
    userId,
    authConfigId,
    {
      redirectUrl: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?connection=success`,
    }
  );

  console.log(`✅ [CONNECT] Connection initiated`);
  console.log(`   Redirect URL: ${connectionRequest.redirectUrl}`);
  console.log(`   Connection ID: ${connectionRequest.id}\n`);

  return {
    redirectUrl: connectionRequest.redirectUrl,
    connectionId: connectionRequest.id,
  };
}

/**
 * Gets all connected accounts for a user
 * @param userId - Unique identifier for the user
 * @returns List of connected accounts with their status
 */
export async function getUserConnections(userId: string) {
  const connections = await composioClient.connectedAccounts.list({
    userIds: [userId],
    statuses: ["ACTIVE", "INITIALIZING", "INITIATED"],
  });

  console.log(`\n🔍 [DEBUG] Fetched ${connections.items.length} connections from Composio\n`);
  
  // Get detailed info for each connection
  const detailedConnections = await Promise.all(
    connections.items.map(async (conn: any) => {
      try {
        // Get full connection details which includes app information
        const fullConn = await composioClient.connectedAccounts.get(conn.id);
        
        // Log EVERYTHING to see what fields exist
        console.log(`\n━━━ Connection ${conn.id} ━━━`);
        console.log(`📋 Full object keys:`, Object.keys(fullConn));
        console.log(`📦 Full object:`, JSON.stringify(fullConn, null, 2));
        
        // Extract integration name - it's an object with a slug property!
        const integrationSlug = fullConn.integration?.slug || fullConn.integration?.name;
        
        const integrationName = 
          integrationSlug ||
          fullConn.integrationId ||
          fullConn.appName ||
          fullConn.appUniqueId ||
          fullConn.app?.name ||
          fullConn.app?.uniqueId ||
          fullConn.appId ||
          fullConn.toolkit ||
          "unknown";
        
        console.log(`✅ Detected integration: "${integrationName}"`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        
        return {
          id: fullConn.id,
          integration: integrationName,
          integrationSlug: integrationSlug,
          status: fullConn.status,
          createdAt: fullConn.createdAt,
          memberInfo: fullConn.memberInfo || fullConn.member || {},
          appName: fullConn.appName,
          appUniqueId: fullConn.appUniqueId,
          integrationId: fullConn.integrationId,
        };
      } catch (error: any) {
        console.error(`❌ Error getting details for connection ${conn.id}:`, error.message);
        return {
          id: conn.id,
          integration: "unknown",
          status: conn.status,
          createdAt: conn.createdAt,
          memberInfo: {},
        };
      }
    })
  );
  
  console.log(`\n✅✅✅ FINAL PROCESSED CONNECTIONS ✅✅✅`);
  detailedConnections.forEach(c => {
    console.log(`  - ${c.id}: integration="${c.integration}", status="${c.status}"`);
  });
  console.log(`\n`);

  return detailedConnections;
}

/**
 * Gets tools for a specific user and integration
 * @param userId - Unique identifier for the user
 * @param toolkits - Array of toolkit names (e.g., ["TWITTER", "REDDIT"])
 * @returns Tools available for the user
 */
export async function getUserTools(userId: string, toolkits: string[]) {
  return await composioClient.tools.get(userId, {
    toolkits,
    limit: 20,
  });
}

/**
 * Executes a tool for a user
 * @param toolSlug - The tool to execute (e.g., "TWITTER_POST_TWEET")
 * @param userId - Unique identifier for the user
 * @param arguments - Tool-specific arguments
 * @param connectedAccountId - Optional: specific connected account to use
 * @returns Execution result
 */
export async function executeTool(
  toolSlug: string,
  userId: string,
  arguments_: Record<string, any>,
  connectedAccountId?: string
) {
  console.log(`\n🔧 [EXECUTE TOOL] Executing ${toolSlug}`);
  console.log(`   User ID: ${userId}`);
  console.log(`   Arguments:`, arguments_);
  if (connectedAccountId) {
    console.log(`   Connected Account ID: ${connectedAccountId}`);
  }
  
  try {
    const result = await composioClient.tools.execute(toolSlug, {
      userId,
      arguments: arguments_,
      ...(connectedAccountId && { connectedAccountId }),
    });
    
    console.log(`✅ [EXECUTE TOOL] Success!`);
    return result;
  } catch (error: any) {
    console.error(`❌ [EXECUTE TOOL] Error:`, error.message);
    throw error;
  }
}

/**
 * Checks if a user has an active connection for an integration
 * @param userId - Unique identifier for the user
 * @param integration - The integration type to check
 * @returns boolean indicating if connection exists and is active
 */
export async function hasActiveConnection(
  userId: string,
  integration: IntegrationType
): Promise<boolean> {
  try {
    console.log(`\n🔍 [CHECK CONNECTION] Checking ${integration} connection for user: ${userId}`);
    
    const connections = await getUserConnections(userId);
    
    console.log(`📋 [CHECK CONNECTION] Found ${connections.length} total connections`);
    
    const integrationMap = {
      TWITTER: "twitter",
      REDDIT: "reddit",
    };
    
    const searchTerm = integrationMap[integration];
    
    const hasConnection = connections.some((conn) => {
      // Handle integration being an object or string
      let integrationStr = "";
      
      if (typeof conn.integration === 'object' && conn.integration !== null) {
        // If it's an object, get the slug property
        integrationStr = String(conn.integration.slug || conn.integration.name || "").toLowerCase();
      } else {
        // If it's a string, use it directly
        integrationStr = String(conn.integration || "").toLowerCase();
      }
      
      // Also check other fields
      const appName = String(conn.appName || "").toLowerCase();
      const appUniqueId = String(conn.appUniqueId || "").toLowerCase();
      const integrationId = String(conn.integrationId || "").toLowerCase();
      
      const matches = integrationStr.includes(searchTerm) ||
                     appName.includes(searchTerm) ||
                     appUniqueId.includes(searchTerm) ||
                     integrationId.includes(searchTerm);
                     
      const isActive = conn.status === "ACTIVE";
      
      console.log(`   - ${conn.id}:`, {
        integrationStr,
        appName,
        appUniqueId,
        matches,
        isActive,
        searchingFor: searchTerm,
      });
      
      return matches && isActive;
    });
    
    console.log(`${hasConnection ? "✅" : "❌"} [CHECK CONNECTION] ${integration} ${hasConnection ? "IS" : "NOT"} connected\n`);
    
    return hasConnection;
  } catch (error) {
    console.error(`❌ Error checking connection for ${integration}:`, error);
    return false;
  }
}

/**
 * Disconnects a connected account
 * @param connectedAccountId - The connected account ID to disconnect
 */
export async function disconnectAccount(connectedAccountId: string) {
  console.log(`🗑️ [LIB] Deleting connection from Composio: ${connectedAccountId}`);
  
  try {
    await composioClient.connectedAccounts.delete(connectedAccountId);
    console.log(`✅ [LIB] Connection ${connectedAccountId} deleted successfully`);
  } catch (error: any) {
    console.error(`❌ [LIB] Failed to delete connection ${connectedAccountId}:`, error.message);
    throw error;
  }
}

