# 🚀 Composio Integration - Quick Start

## What We Built

I've set up a complete Composio integration for Twitter and Reddit with OAuth authentication and AI-powered automation using Claude (Anthropic).

### 📁 Files Created

1. **`lib/composio-client.ts`** - Core Composio client utilities
2. **`lib/composio-automation.ts`** - Claude + Composio automation examples
3. **`app/api/composio/connect/route.ts`** - OAuth connection endpoint
4. **`app/api/composio/connections/route.ts`** - Get user connections
5. **`app/api/composio/disconnect/route.ts`** - Disconnect accounts
6. **`app/api/composio/automate/route.ts`** - Automated posting with Claude
7. **`app/dashboard/integrations/page.tsx`** - Updated UI with working OAuth

---

## ⚡ Quick Setup (3 Steps)

### Step 1: Create a `.env.local` file

```bash
# In your project root
cat > .env.local << 'EOF'
COMPOSIO_API_KEY=your_composio_api_key_here
TWITTER_AUTH_CONFIG_ID=your_twitter_auth_config_id
REDDIT_AUTH_CONFIG_ID=your_reddit_auth_config_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
ANTHROPIC_API_KEY=your_anthropic_api_key
EOF
```

### Step 2: Fill in the values

1. **COMPOSIO_API_KEY**: Get from [Composio Dashboard](https://platform.composio.dev) → Settings → API Keys

2. **TWITTER_AUTH_CONFIG_ID** and **REDDIT_AUTH_CONFIG_ID**: 
   - Go to [Auth Configs](https://platform.composio.dev?next_page=%2Fauth-configs)
   - Click "Create Auth Config" for each platform
   - Copy the Auth Config IDs (format: `ac_xxxxx`)

3. **ANTHROPIC_API_KEY**: Get from [Anthropic Console](https://console.anthropic.com/)

### Step 3: Run the app

```bash
npm run dev
```

Visit: `http://localhost:3000/dashboard/integrations`

---

## 🎯 How It Works

### User Flow

1. **User clicks "Connect"** on Twitter or Reddit card
2. **OAuth flow initiates** via Composio (secure, managed auth)
3. **User authorizes** the app on Twitter/Reddit
4. **Connection established** and stored in Composio
5. **Green dot appears** on the integration card

### Behind the Scenes

```typescript
// 1. User clicks Connect → API call to /api/composio/connect
const response = await fetch("/api/composio/connect", {
  method: "POST",
  body: JSON.stringify({
    userId: "project-123",  // From your projects context
    integration: "TWITTER"
  })
});

// 2. You get a redirect URL
const { redirectUrl } = await response.json();

// 3. User is redirected to Composio-hosted OAuth page
window.location.href = redirectUrl;

// 4. After auth, user returns to your app
// Connection is now ACTIVE and ready to use!
```

---

## 🤖 Using AI Automation

Once users are connected, you can automate posts using Claude:

### Example 1: Auto-post a Tweet

```typescript
import { autoPostTweet } from "@/lib/composio-automation";

const result = await autoPostTweet(
  userId,
  "AcmeCRM - AI-powered CRM for startups",
  "our new analytics dashboard feature"
);
```

Claude will:
- ✅ Generate an engaging tweet
- ✅ Add relevant hashtags
- ✅ Post it to Twitter automatically

### Example 2: Auto-post to Reddit

```typescript
import { autoPostReddit } from "@/lib/composio-automation";

const result = await autoPostReddit(
  userId,
  "startups",  // subreddit
  "AcmeCRM - AI-powered CRM",
  "How we built our product in 3 months"
);
```

Claude will:
- ✅ Generate Reddit-appropriate content
- ✅ Create an engaging title
- ✅ Write detailed post body
- ✅ Post to r/startups

### Example 3: Multi-platform posting

```typescript
import { autoPostMultiPlatform } from "@/lib/composio-automation";

const result = await autoPostMultiPlatform(
  userId,
  "AcmeCRM",
  "We just hit 10,000 users! 🎉",
  "startups"
);
```

Claude will:
- ✅ Create a tweet (short & engaging)
- ✅ Create a Reddit post (detailed & conversational)
- ✅ Post to both platforms automatically

---

## 🎮 Testing the API

### Test 1: Connect Twitter

1. Go to: `http://localhost:3000/dashboard/integrations`
2. Click "Connect" on Twitter/X card
3. Authorize the app
4. Should redirect back with green dot ✅

### Test 2: Auto-post a Tweet (via API)

```bash
curl -X POST http://localhost:3000/api/composio/automate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "default",
    "action": "tweet",
    "companyInfo": "AcmeCRM - AI-powered CRM for startups",
    "topic": "our new dashboard feature"
  }'
```

### Test 3: Multi-platform Post

```bash
curl -X POST http://localhost:3000/api/composio/automate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "default",
    "action": "multi",
    "companyInfo": "AcmeCRM",
    "topic": "We just launched our public beta!",
    "subreddit": "startups"
  }'
```

---

## 📚 Available Functions

### From `composio-client.ts`

```typescript
// Initialize connection
initiateConnection(userId, "TWITTER", callbackUrl)

// Get user's connections
getUserConnections(userId)

// Check if user has active connection
hasActiveConnection(userId, "TWITTER")

// Get tools for user
getUserTools(userId, ["TWITTER", "REDDIT"])

// Execute a specific tool
executeTool("TWITTER_POST_TWEET", userId, { text: "Hello!" })

// Disconnect account
disconnectAccount(connectedAccountId)
```

### From `composio-automation.ts`

```typescript
// Auto-post tweet with AI
autoPostTweet(userId, companyInfo, topic)

// Auto-post to Reddit with AI
autoPostReddit(userId, subreddit, companyInfo, topic)

// Multi-platform posting
autoPostMultiPlatform(userId, companyInfo, announcement, subreddit)

// Respond to Reddit mentions
respondToRedditMentions(userId, companyInfo)

// Scheduled marketing post
scheduledMarketingPost(userId, projectSettings)

// Engage with trending topics
engageWithTrendingTopics(userId, companyInfo, keywords)

// Check user connections
checkUserConnections(userId)
```

---

## 🔐 Security Notes

- ✅ OAuth is handled by Composio (secure)
- ✅ Credentials never stored in your database
- ✅ Users can disconnect at any time
- ✅ All connections are scoped per user/project

---

## 🎨 Customization Ideas

### 1. Add to your Posts page

```typescript
import { autoPostTweet } from "@/lib/composio-automation";
import { useProjects } from "@/lib/projects-context";

function PostsPage() {
  const { currentProject } = useProjects();
  
  const handleAutoPost = async () => {
    const result = await autoPostTweet(
      currentProject.id,
      currentProject.settings.brandName,
      "your topic here"
    );
    // Show success message
  };
  
  return (
    <button onClick={handleAutoPost}>
      🤖 Auto-generate and Post Tweet
    </button>
  );
}
```

### 2. Schedule automated posts

```typescript
// In your cron job or scheduled task
import { scheduledMarketingPost } from "@/lib/composio-automation";

setInterval(async () => {
  const projects = await getActiveProjects();
  
  for (const project of projects) {
    await scheduledMarketingPost(project.id, project.settings);
  }
}, 24 * 60 * 60 * 1000); // Daily
```

### 3. Monitor and respond

```typescript
import { respondToRedditMentions } from "@/lib/composio-automation";

// Run every hour
setInterval(async () => {
  await respondToRedditMentions(userId, companyInfo);
}, 60 * 60 * 1000);
```

---

## 🐛 Troubleshooting

### "Auth config ID not found"
**Fix**: Make sure your `.env.local` has the correct auth config IDs from Composio dashboard

### "No active connections"
**Fix**: Go to `/dashboard/integrations` and connect Twitter/Reddit first

### OAuth redirect loops
**Fix**: Check that `NEXT_PUBLIC_APP_URL` matches your current URL

### "Failed to fetch connections"
**Fix**: Verify `COMPOSIO_API_KEY` is correct and has permissions

---

## 📖 Next Steps

1. ✅ Set up environment variables
2. ✅ Create auth configs in Composio dashboard
3. ✅ Test OAuth connection flow
4. ✅ Try the automation API endpoints
5. 🎯 Integrate into your Posts page
6. 🎯 Set up scheduled automation
7. 🎯 Add monitoring and analytics

---

## 🔗 Useful Links

- [Composio Dashboard](https://platform.composio.dev)
- [Composio Docs](https://docs.composio.dev)
- [Browse All Tools](https://platform.composio.dev/tools)
- [Anthropic Console](https://console.anthropic.com/)

---

## 💡 Pro Tips

1. **Test with "default" user first** before using real user IDs
2. **Use project IDs as userIds** - already implemented in the UI!
3. **Start with managed auth** in dev, switch to your own OAuth in production
4. **Monitor usage** in Composio dashboard to track API calls
5. **Set daily limits** to prevent accidental spam

---

Need help? Check `COMPOSIO_SETUP.md` for detailed setup instructions!

