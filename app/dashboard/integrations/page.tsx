"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState, useEffect } from "react";

type Integration = {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: "TWITTER" | "REDDIT" | "LINKEDIN" | "WHATSAPP" | "IMESSAGE";
  isComposio: boolean;
};

const integrations: Integration[] = [
  {
    id: "twitter",
    name: "X",
    description: "Connect your X account to post and engage",
    icon: "/icons/twitter.png",
    type: "TWITTER",
    isComposio: true,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Publish posts to your LinkedIn profile",
    icon: "/icons/linkedin.svg",
    type: "LINKEDIN",
    isComposio: true,
  },
  {
    id: "reddit",
    name: "Reddit",
    description: "Monitor and reply to conversations",
    icon: "/icons/reddit.png",
    type: "REDDIT",
    isComposio: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Receive drafts and approvals via WhatsApp",
    icon: "/icons/whatsapp.png",
    type: "WHATSAPP",
    isComposio: false,
  },
  {
    id: "imessage",
    name: "iMessage",
    description: "Receive alerts and approvals via iMessage",
    icon: "/icons/messages.png",
    type: "IMESSAGE",
    isComposio: false,
  },
];

type ConnectionStatus = {
  [key: string]: {
    connected: boolean;
    loading: boolean;
    accountId?: string;
    username?: string;
  };
};

export default function IntegrationsPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({});
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  // Fetch existing connections on mount
  useEffect(() => {
    fetchConnections();
    
    // Check for OAuth callback success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("connection") === "success") {
      console.log("✅ [UI] OAuth callback detected - refreshing connections");
      
      // Show success message
      const connectedAccountId = urlParams.get("connectedAccountId");
      const appName = urlParams.get("appName");
      if (connectedAccountId && appName) {
        console.log(`✅ [UI] Connection successful: ${appName} (${connectedAccountId})`);
        // Show user-friendly success message
        alert(`✅ Successfully connected ${appName}!\n\nThe connection is being processed. It may take a few seconds to appear.`);
      }
      
      // Remove the query parameter from URL
      window.history.replaceState({}, "", "/dashboard/integrations");
      
      // Fetch connections after delays to allow Composio to process
      setTimeout(() => {
        console.log("🔄 [UI] Re-fetching after OAuth callback (first attempt)");
        fetchConnections();
      }, 2000);
      
      setTimeout(() => {
        console.log("🔄 [UI] Re-fetching after OAuth callback (second attempt)");
        fetchConnections();
      }, 5000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for webhook updates every 3 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const checkForUpdates = async () => {
      try {
        const response = await fetch(`/api/composio/webhook`, {
          credentials: "include",
        });
        const data = await response.json();
        
        if (data.hasUpdate) {
          console.log("🔔 New connection detected via webhook!");
          fetchConnections();
        }
      } catch (error) {
        console.error("Error checking webhook updates:", error);
      }
    };

    // Start polling after initial load completes
    if (!isLoadingConnections) {
      console.log("🔄 Starting webhook polling...");
      interval = setInterval(checkForUpdates, 3000);
    }
    
    // Cleanup on unmount
    return () => {
      if (interval) {
        console.log("🛑 Stopping webhook polling");
        clearInterval(interval);
      }
    };
  }, [isLoadingConnections]);

  const fetchConnections = async () => {
    // Don't fetch if we don't have a userId
    setIsLoadingConnections(true);
    try {
      console.log("🔍 Fetching connections (server will infer user)");
      const response = await fetch(`/api/composio/connections`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("\n━━━━━ FRONTEND: API RESPONSE ━━━━━");
      console.log("📦 Full response:", JSON.stringify(data, null, 2));

      if (data.error) {
        console.error("❌ API Error:", data.error);
        throw new Error(data.error);
      }

      if (data.connections) {
        const status: ConnectionStatus = {};
        
        console.log(`\n📊 Found ${data.connections.length} connection(s) from API\n`);
        
        // Map connections to our integrations
        data.connections.forEach((conn: any, index: number) => {
          console.log(`\n━━━ Processing Connection #${index + 1} ━━━`);
          
          // Safely convert to string and lowercase
          // Check if integration is an object with slug property
          const integrationValue = typeof conn.integration === 'object' && conn.integration !== null
            ? (conn.integration.slug || conn.integration.name || "")
            : (conn.integration || "");
          
          const integration = String(integrationValue).toLowerCase();
          const integrationSlug = String(conn.integrationSlug || "").toLowerCase();
          const appName = String(conn.appName || "").toLowerCase();
          const appUniqueId = String(conn.appUniqueId || "").toLowerCase();
          const integrationId = String((conn as any).integrationId || "").toLowerCase();
          
          console.log(`🔗 [UI] Processing connection:`, {
            id: conn.id,
            integration,
            appName,
            appUniqueId,
            status: conn.status,
          });
          
          // Extract username from memberInfo
          const username = conn.memberInfo?.username || 
                          conn.memberInfo?.name || 
                          conn.memberInfo?.email || 
                          conn.memberInfo?.displayName ||
                          "Connected User";
          
          // More flexible matching - check all possible fields including slug
          const isTwitter = integration.includes("twitter") || 
                           integration.includes("x") ||
                           integration.includes("twit") ||
                           integrationSlug.includes("twitter") ||
                           integrationSlug.includes("x") ||
                           appName.includes("twitter") ||
                           appName.includes("x") ||
                           appUniqueId.includes("twitter") ||
                           appUniqueId.includes("x") ||
                           integrationId.includes("twitter") ||
                           integrationId.includes("x");
                           
          const isReddit = integration.includes("reddit") ||
                          integrationSlug.includes("reddit") ||
                          appName.includes("reddit") ||
                          appUniqueId.includes("reddit") ||
                          integrationId.includes("reddit");

          const isLinkedIn = integration.includes("linkedin") ||
                            integrationSlug.includes("linkedin") ||
                            appName.includes("linkedin") ||
                            appUniqueId.includes("linkedin") ||
                            integrationId.includes("linkedin");
          
          console.log(`🔍 [UI] Match check for ${conn.id}:`, {
            isTwitter,
            isLinkedIn,
            isReddit,
            integration,
            integrationSlug,
            appName,
            appUniqueId,
            integrationId,
            rawIntegration: conn.integration,
          });
          
          if (isTwitter && conn.status === "ACTIVE") {
            status["twitter"] = {
              connected: true,
              loading: false,
              accountId: conn.id,
              username: username,
            };
            console.log("✅ [UI] Twitter ACTIVE connection mapped:", status["twitter"]);
          } else if (isLinkedIn && conn.status === "ACTIVE") {
            status["linkedin"] = {
              connected: true,
              loading: false,
              accountId: conn.id,
              username: username,
            };
            console.log("✅ [UI] LinkedIn ACTIVE connection mapped:", status["linkedin"]);
          } else if (isReddit && conn.status === "ACTIVE") {
            status["reddit"] = {
              connected: true,
              loading: false,
              accountId: conn.id,
              username: username,
            };
            console.log("✅ [UI] Reddit ACTIVE connection mapped:", status["reddit"]);
          } else if (isTwitter || isLinkedIn || isReddit) {
            const type = isTwitter ? "Twitter" : isLinkedIn ? "LinkedIn" : "Reddit";
            console.log(`⏳ [UI] ${type} connection ${conn.id} is ${conn.status} (not ACTIVE yet)`);
          } else {
            console.log(`⚠️ [UI] Connection ${conn.id} not recognized as Twitter, LinkedIn, or Reddit`);
          }
        });

        console.log("\n━━━━━ FINAL STATUS TO SET IN STATE ━━━━━");
        console.log("📊 Status object:", JSON.stringify(status, null, 2));
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        
        setConnectionStatus(status);
        
        // Verify state was set
        setTimeout(() => {
          console.log("🔍 Verifying state after 100ms...");
          console.log("Current connectionStatus:", status);
        }, 100);
      } else {
        console.log("ℹ️ No connections found");
        setConnectionStatus({});
      }
    } catch (error: any) {
      console.error("❌ Error fetching connections:", error);
      alert(`Failed to fetch connections: ${error.message}\n\nCheck console for details.`);
    } finally {
      setIsLoadingConnections(false);
    }
  };

  const handleConnect = async (integration: Integration) => {
    if (!integration.isComposio) {
      alert("Coming soon!");
      return;
    }

    // Set loading state
    setConnectionStatus((prev) => ({
      ...prev,
      [integration.id]: { connected: false, loading: true },
    }));

    try {
      console.log(`🔗 [UI] Initiating ${integration.name} connection (server infers user)`);
      
      // Call API to initiate OAuth
      const response = await fetch("/api/composio/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          integration: integration.type,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Redirect to OAuth page
      window.location.href = data.redirectUrl;
    } catch (error: any) {
      console.error("Connection error:", error);
      alert(`Failed to connect: ${error.message}`);
      setConnectionStatus((prev) => ({
        ...prev,
        [integration.id]: { connected: false, loading: false },
      }));
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    const accountId = connectionStatus[integration.id]?.accountId;
    const username = connectionStatus[integration.id]?.username;
    
    if (!accountId) {
      console.error("❌ No account ID found for", integration.name);
      alert(`Cannot disconnect ${integration.name} - no account found`);
      return;
    }

    // Confirm disconnection
    const confirmMessage = username 
      ? `Disconnect ${integration.name} account "${username}"?\n\nYou'll need to reconnect to use it again.`
      : `Disconnect ${integration.name}?\n\nYou'll need to reconnect to use it again.`;
    
    if (!confirm(confirmMessage)) {
      console.log(`❌ User cancelled disconnect for ${integration.name}`);
      return;
    }

    console.log(`\n🔌 [UI] Disconnecting ${integration.name} (${accountId})...`);

    setConnectionStatus((prev) => ({
      ...prev,
      [integration.id]: { ...prev[integration.id], loading: true },
    }));

    try {
      console.log(`📡 [UI] Calling disconnect API...`);
      const response = await fetch("/api/composio/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ connectedAccountId: accountId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log(`✅ [UI] Successfully disconnected ${integration.name}`);
        
        // Show success message
        alert(`✅ Successfully disconnected ${integration.name}!\n\nYou can reconnect anytime.`);
        
        // Immediately update UI to show disconnected
        setConnectionStatus((prev) => ({
          ...prev,
          [integration.id]: { connected: false, loading: false },
        }));
        
        // Refresh connections from server to confirm
        setTimeout(() => {
          console.log(`🔄 [UI] Fetching updated connection list to confirm...`);
          fetchConnections();
        }, 500);
      } else {
        throw new Error(data.error || "Failed to disconnect");
      }
    } catch (error: any) {
      console.error(`❌ [UI] Disconnect error for ${integration.name}:`, error);
      alert(`❌ Failed to disconnect ${integration.name}\n\nError: ${error.message}\n\nPlease try again or check the console for details.`);
      setConnectionStatus((prev) => ({
        ...prev,
        [integration.id]: { ...prev[integration.id], loading: false },
      }));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-mono text-3xl font-bold mb-1">Integrations</h1>
        <p className="text-sm text-neutral-600">Connect your platforms to get started</p>
      </div>

      {/* Grid of Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {integrations.map((integration) => {
          const status = connectionStatus[integration.id];
          const isConnected = status?.connected || false;
          const isLoading =
            status?.loading || (isLoadingConnections && !status?.connected && !status?.loading);
          const username = status?.username;

          return (
            <Card
              key={integration.name}
              className="p-6 border border-neutral-200 hover:border-neutral-300 transition-colors"
            >
              <div className="mb-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <Image
                      src={integration.icon}
                      alt={integration.name}
                      width={50}
                      height={50}
                      className="object-contain"
                    />
                    {isConnected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                </div>
                <h3 className="font-mono font-bold text-base mb-1 text-center">
                  {integration.name}
                </h3>
                
                {/* Show username if connected */}
                {isConnected && username ? (
                  <p className="font-mono text-xs text-green-700 font-semibold text-center mb-2">
                    Connected: {username}
                  </p>
                ) : (
                  <p className="font-mono text-xs text-neutral-600 text-center">
                    {integration.description}
                  </p>
                )}
              </div>
              
              {/* Connect or Disconnect Button */}
              {isConnected ? (
                <Button
                  onClick={() => handleDisconnect(integration)}
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-mono text-xs"
                >
                  {isLoading ? "Disconnecting..." : "Disconnect"}
                </Button>
              ) : (
                <Button
                  onClick={() => handleConnect(integration)}
                  disabled={isLoading || !integration.isComposio}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs disabled:opacity-50"
                >
                  {isLoading ? "Connecting..." : "Connect"}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-mono font-bold text-sm mb-2">🔐 Secure OAuth Authentication</h3>
        <p className="font-mono text-xs text-neutral-700">
          Your credentials are securely managed by Composio. We never store your passwords. 
          You can disconnect at any time.
        </p>
      </div>
    </div>
  );
}
