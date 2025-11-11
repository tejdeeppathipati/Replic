#!/usr/bin/env node
/**
 * iMessage Bridge Server - Using @photon-ai/imessage-kit
 * Real iMessage SDK for macOS
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { IMessageSDK } from '@photon-ai/imessage-kit';

const app = express();
app.use(cors());
app.use(express.json());

// Lazy SDK initialization - only when needed
let sdk: IMessageSDK | null = null;
let sdkInitialized = false;
let sdkError: string | null = null;

function getSDK(): IMessageSDK {
  if (!sdkInitialized) {
    try {
      console.log('🔧 Initializing iMessage SDK...');
      sdk = new IMessageSDK({
        debug: process.env.DEBUG === 'true',
        maxConcurrent: 5
      });
      sdkInitialized = true;
      sdkError = null;
      console.log('✅ SDK initialized successfully');
    } catch (error: any) {
      sdkError = error.message || 'Failed to initialize SDK';
      console.error(`❌ SDK initialization failed: ${sdkError}`);
      throw new Error(
        `SDK initialization failed: ${sdkError}\n\n` +
        `🔒 SOLUTION: Grant Full Disk Access:\n` +
        `1. System Settings → Privacy & Security → Full Disk Access\n` +
        `2. Click "+" and add Terminal (or your IDE)\n` +
        `3. Restart Terminal\n` +
        `4. Try again`
      );
    }
  }
  
  if (!sdk) {
    throw new Error('SDK not initialized');
  }
  
  return sdk;
}

// Health check
app.get('/health', (req: Request, res: Response) => {
  if (sdkError) {
    return res.status(503).json({
      status: 'error',
      service: 'imessage-bridge',
      sdk: '@photon-ai/imessage-kit',
      error: sdkError,
      solution: 'Grant Full Disk Access in System Settings → Privacy & Security'
    });
  }
  
  res.json({
    status: 'ok',
    service: 'imessage-bridge',
    sdk: '@photon-ai/imessage-kit',
    initialized: sdkInitialized
  });
});

// Send iMessage
app.post('/send', async (req: Request, res: Response) => {
  try {
    const { recipient, text } = req.body;

    if (!recipient || !text) {
      return res.status(400).json({
        error: "Missing 'recipient' or 'text' field"
      });
    }

    console.log(`📱 Sending iMessage to ${recipient}`);

    // Get SDK (will initialize if needed)
    const sdkInstance = getSDK();
    
    // Send using the real SDK
    await sdkInstance.send(recipient, text);

    console.log(`✅ iMessage sent to ${recipient}`);

    res.json({
      status: 'sent',
      recipient,
      message: 'iMessage sent successfully'
    });
  } catch (error: any) {
    console.error(`❌ Error sending iMessage: ${error.message}`);
    
    // Check if it's a permission error
    if (error.message.includes('database') || error.message.includes('permission')) {
      return res.status(503).json({
        status: 'failed',
        error: error.message,
        solution: 'Grant Full Disk Access in System Settings → Privacy & Security → Full Disk Access'
      });
    }
    
    res.status(500).json({
      status: 'failed',
      error: error.message || 'Failed to send iMessage'
    });
  }
});

// Test endpoint
app.get('/test', async (req: Request, res: Response) => {
  try {
    const recipient = req.query.recipient as string;

    if (!recipient) {
      return res.status(400).json({
        error: "Missing 'recipient' parameter",
        usage: "/test?recipient=+15551234567"
      });
    }

    const testMessage = '🤖 Replic iMessage Bridge - Test Message';

    console.log(`🧪 Sending test message to ${recipient}`);
    
    // Get SDK (will initialize if needed)
    const sdkInstance = getSDK();
    await sdkInstance.send(recipient, testMessage);

    res.json({
      status: 'success',
      message: `Test message sent to ${recipient}`
    });
  } catch (error: any) {
    console.error(`❌ Test failed: ${error.message}`);
    
    // Check if it's a permission error
    if (error.message.includes('database') || error.message.includes('permission')) {
      return res.status(503).json({
        status: 'failed',
        error: error.message,
        solution: 'Grant Full Disk Access in System Settings → Privacy & Security → Full Disk Access'
      });
    }
    
    res.status(500).json({
      status: 'failed',
      error: error.message || 'Failed to send test message'
    });
  }
});

// Get unread messages (for webhook/receiving)
app.get('/messages/unread', async (req: Request, res: Response) => {
  try {
    const sdkInstance = getSDK();
    const unreadMessages = await sdkInstance.getUnreadMessages();
    res.json({
      status: 'ok',
      count: unreadMessages.length,
      messages: unreadMessages
    });
  } catch (error: any) {
    console.error(`❌ Error getting messages: ${error.message}`);
    res.status(500).json({
      status: 'failed',
      error: error.message
    });
  }
});

// Start watching for new messages (webhook support)
let isWatching = false;
let currentWebhookUrl: string | null = null;

app.post('/watch/start', async (req: Request, res: Response) => {
  try {
    const { webhookUrl, webhookHeaders } = req.body;

    if (isWatching && webhookUrl === currentWebhookUrl) {
      return res.json({
        status: 'already_watching',
        message: 'Already watching for messages',
        webhookUrl: currentWebhookUrl
      });
    }

    // Stop existing watch if different webhook
    if (isWatching) {
      console.log('🛑 Stopping existing watch to update webhook...');
      const sdkInstance = getSDK();
      sdkInstance.stopWatching();
      isWatching = false;
    }

    currentWebhookUrl = webhookUrl || null;
    console.log(`🔍 Starting watch with webhook: ${currentWebhookUrl}`);

    const sdkInstance = getSDK();
    await sdkInstance.startWatching({
      onNewMessage: async (message) => {
        // Skip messages from ourselves (isFromMe is true)
        if (message.isFromMe) {
          console.log(`⏭️  Skipping own message: ${message.text}`);
          return;
        }

        console.log(`📨 New message from ${message.sender}: ${message.text}`);

        // Send to webhook if configured
        if (currentWebhookUrl) {
          try {
            console.log(`📤 Forwarding to webhook: ${currentWebhookUrl}`);
            const response = await fetch(currentWebhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...webhookHeaders
              },
              body: JSON.stringify({
                event: 'new_message',
                message: {
                  id: message.id,
                  text: message.text,
                  sender: message.sender,
                  chatId: message.chatId,
                  isGroupChat: message.isGroupChat,
                  date: message.date.toISOString()
                },
                timestamp: new Date().toISOString()
              })
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`❌ Webhook returned ${response.status}: ${errorText}`);
            } else {
              const responseData = await response.json().catch(() => ({}));
              console.log(`✅ Message forwarded to webhook, response: ${JSON.stringify(responseData)}`);
            }
          } catch (error: any) {
            console.error(`❌ Webhook error: ${error.message}`);
            console.error(`   Stack: ${error.stack}`);
          }
        } else {
          console.log(`⚠️  No webhook URL configured, message not forwarded`);
        }
      },
      onGroupMessage: async (message) => {
        console.log(`👥 Group message in ${message.chatId}`);
        // Also forward group messages if webhook is configured
        if (currentWebhookUrl && !message.isFromMe) {
          try {
            console.log(`📤 Forwarding group message to webhook`);
            await fetch(currentWebhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...webhookHeaders
              },
              body: JSON.stringify({
                event: 'new_message',
                message: {
                  id: message.id,
                  text: message.text,
                  sender: message.sender,
                  chatId: message.chatId,
                  isGroupChat: true,
                  date: message.date.toISOString()
                },
                timestamp: new Date().toISOString()
              })
            });
          } catch (error: any) {
            console.error(`❌ Group message webhook error: ${error.message}`);
          }
        }
      },
      onError: (error) => {
        console.error(`❌ Watcher error: ${error.message}`);
      }
    });

    isWatching = true;
    console.log(`✅ Watch started successfully with webhook: ${currentWebhookUrl}`);

    res.json({
      status: 'started',
      message: 'Watching for new messages',
      webhookUrl: currentWebhookUrl || 'none'
    });
  } catch (error: any) {
    console.error(`❌ Error starting watcher: ${error.message}`);
    res.status(500).json({
      status: 'failed',
      error: error.message
    });
  }
});

app.post('/watch/stop', (req: Request, res: Response) => {
  try {
    if (sdk) {
      sdk.stopWatching();
    }
    isWatching = false;
    currentWebhookUrl = null;
    console.log('🛑 Watch stopped');
    res.json({
      status: 'stopped',
      message: 'Stopped watching for messages'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'failed',
      error: error.message
    });
  }
});

// Graceful shutdown
// Port can be changed via environment variable: PORT=5174 npm run dev
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5173;

const server = app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📱 iMessage Bridge Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('✅ Using: @photon-ai/imessage-kit');
  console.log(`✅ Running on: http://localhost:${PORT}`);
  console.log('');
  console.log('📝 Note: SDK will initialize when first used');
  console.log('   (Requires Full Disk Access if not granted)');
  console.log('');
  console.log('🧪 Test with:');
  console.log(`   curl 'http://localhost:${PORT}/test?recipient=YOUR_NUMBER'`);
  console.log('');
  console.log('🔍 Check health:');
  console.log(`   curl http://localhost:${PORT}/health`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
});

// Cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  if (sdk) {
    sdk.stopWatching();
    await sdk.close();
  }
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  if (sdk) {
    sdk.stopWatching();
    await sdk.close();
  }
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

