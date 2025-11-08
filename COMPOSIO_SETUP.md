# Composio Integration Setup Guide

This guide will help you set up Twitter and Reddit integrations using Composio for OAuth authentication.

## 📋 Prerequisites

1. A Composio account ([Sign up here](https://platform.composio.dev))
2. Twitter Developer Account
3. Reddit Developer Account

## 🔑 Step 1: Get Your Composio API Key

1. Go to [Composio Dashboard](https://platform.composio.dev)
2. Navigate to **Settings** → **API Keys**
3. Copy your API key

## 🛠️ Step 2: Create Auth Configs

You need to create auth configs for both Twitter and Reddit in your Composio dashboard.

### Twitter Auth Config

1. Go to [Auth Configs](https://platform.composio.dev?next_page=%2Fauth-configs)
2. Click **"Create Auth Config"**
3. Select **Twitter** (or X)
4. Choose **OAuth 2.0** as authentication method
5. Configure required scopes:
   - `tweet.read`
   - `tweet.write`
   - `users.read`
   - `offline.access` (for refresh tokens)
6. Choose authentication management:
   - **Development**: Use Composio's managed auth (easiest for testing)
   - **Production**: Provide your own Twitter OAuth credentials
7. Click **"Create Auth Configuration"**
8. **Copy the Auth Config ID** (looks like: `ac_xxxxx`)

### Reddit Auth Config

1. Go to [Auth Configs](https://platform.composio.dev?next_page=%2Fauth-configs)
2. Click **"Create Auth Config"**
3. Select **Reddit**
4. Choose **OAuth 2.0** as authentication method
5. Configure required scopes:
   - `submit`
   - `read`
   - `identity`
6. Choose authentication management:
   - **Development**: Use Composio's managed auth
   - **Production**: Provide your own Reddit OAuth credentials
7. Click **"Create Auth Configuration"**
8. **Copy the Auth Config ID** (looks like: `ac_xxxxx`)

## ⚙️ Step 3: Configure Environment Variables

1. Copy the template file:
   ```bash
   cp .env.local.template .env.local
   ```

2. Open `.env.local` and fill in your values:
   ```env
   COMPOSIO_API_KEY=your_composio_api_key_from_step_1
   TWITTER_AUTH_CONFIG_ID=ac_xxxxx_from_twitter_config
   REDDIT_AUTH_CONFIG_ID=ac_xxxxx_from_reddit_config
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ANTHROPIC_API_KEY=your_anthropic_key_if_you_have_it
   ```

## 🚀 Step 4: Run Your Application

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Navigate to **Integrations** page: `http://localhost:3000/dashboard/integrations`

4. Click **"Connect"** on Twitter or Reddit cards

5. You'll be redirected to the OAuth authorization page

6. After authorization, you'll be redirected back to your app with the connection established!

## 🔍 Verification

To verify your connections are working:

1. Check the Integrations page - connected accounts should show a green dot
2. Visit [Composio Dashboard → Connected Accounts](https://platform.composio.dev?next_page=%2Fconnected-accounts)
3. You should see your Twitter and/or Reddit connections listed

## 🛠️ Using Composio Tools

Once connected, you can use Composio tools to interact with Twitter and Reddit. Example:

```typescript
import { composioClient, getUserTools, executeTool } from "@/lib/composio-client";

// Get available tools for the user
const tools = await getUserTools(userId, ["TWITTER", "REDDIT"]);

// Post a tweet
const result = await executeTool(
  "TWITTER_POST_TWEET",
  userId,
  { text: "Hello from my app!" }
);

// Create a Reddit post
const redditPost = await executeTool(
  "REDDIT_SUBMIT_POST",
  userId,
  {
    subreddit: "test",
    title: "My Post Title",
    text: "Post content here"
  }
);
```

## 🤖 Using with Claude (Anthropic)

To use Claude to automate posts, check out the example in the documentation:

```typescript
import { Composio } from "@composio/core";
import { AnthropicProvider } from "@composio/anthropic";
import { Anthropic } from "@anthropic-ai/sdk";

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new AnthropicProvider(),
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Get tools for the user
const tools = await composio.tools.get(userId, {
  toolkits: ["TWITTER", "REDDIT"],
  limit: 10,
});

// Use Claude to generate and post content
const msg = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  tools: tools,
  messages: [
    {
      role: "user",
      content: "Post a tweet about our new product launch",
    },
  ],
  max_tokens: 1024,
});

// Handle tool calls
const result = await composio.provider.handleToolCalls(userId, msg);
```

## 📚 Available Tools

### Twitter Tools
- `TWITTER_POST_TWEET` - Post a tweet
- `TWITTER_GET_USER_TWEETS` - Get user's tweets
- `TWITTER_LIKE_TWEET` - Like a tweet
- `TWITTER_RETWEET` - Retweet
- And many more...

### Reddit Tools
- `REDDIT_SUBMIT_POST` - Submit a post
- `REDDIT_GET_SUBREDDIT_POSTS` - Get posts from a subreddit
- `REDDIT_COMMENT_ON_POST` - Comment on a post
- `REDDIT_UPVOTE` - Upvote content
- And many more...

Browse all available tools at: https://platform.composio.dev/tools

## 🐛 Troubleshooting

### "Auth config ID not found"
- Make sure you've copied the correct auth config IDs from Composio
- Verify your `.env.local` file has the correct values
- Restart your Next.js dev server after changing env variables

### OAuth redirect errors
- Check that `NEXT_PUBLIC_APP_URL` matches your current URL
- For production, update this to your production domain

### Connection shows as PENDING
- The OAuth flow might not have completed
- Try disconnecting and reconnecting
- Check Composio dashboard for connection status

## 📞 Support

- [Composio Documentation](https://docs.composio.dev)
- [Composio Discord Community](https://discord.gg/composio)
- [GitHub Issues](https://github.com/ComposioHQ/composio/issues)

