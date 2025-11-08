/**
 * Composio + Claude Automation Examples
 * 
 * This file contains examples of how to use Claude (Anthropic) with Composio
 * to automate Twitter and Reddit posts for marketing purposes.
 */

import { Composio } from "@composio/core";
import { AnthropicProvider } from "@composio/anthropic";
import Anthropic from "@anthropic-ai/sdk";

// Initialize Composio with Anthropic provider
const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new AnthropicProvider(),
});

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Example 1: Generate and post a tweet using Claude
 */
export async function autoPostTweet(
  userId: string,
  companyInfo: string,
  postTopic: string
) {
  // Get Twitter tools for the user
  const tools = await composio.tools.get(userId, {
    toolkits: ["TWITTER"],
    limit: 10,
  });

  // Ask Claude to create and post a tweet
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    tools: tools,
    messages: [
      {
        role: "user",
        content: `You are a social media manager for ${companyInfo}. 
        
Create and post an engaging tweet about: ${postTopic}

Guidelines:
- Keep it under 280 characters
- Make it engaging and professional
- Include relevant hashtags
- Use emojis where appropriate

After creating the tweet, use the TWITTER_POST_TWEET tool to post it.`,
      },
    ],
    max_tokens: 2000,
  });

  // Handle tool calls (Composio executes the tweet posting)
  const result = await composio.provider.handleToolCalls(userId, msg);
  return result;
}

/**
 * Example 2: Generate and post to Reddit using Claude
 */
export async function autoPostReddit(
  userId: string,
  subreddit: string,
  companyInfo: string,
  topic: string
) {
  // Get Reddit tools for the user
  const tools = await composio.tools.get(userId, {
    toolkits: ["REDDIT"],
    limit: 10,
  });

  // Ask Claude to create and post to Reddit
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    tools: tools,
    messages: [
      {
        role: "user",
        content: `You are a community manager for ${companyInfo}.

Create and submit a post to r/${subreddit} about: ${topic}

Guidelines:
- Follow Reddit's community guidelines
- Be authentic and conversational
- Provide value to the community
- Don't be overly promotional
- Create an engaging title (max 300 characters)
- Write detailed post content

After creating the content, use the REDDIT_SUBMIT_POST tool to post it.`,
      },
    ],
    max_tokens: 3000,
  });

  // Handle tool calls
  const result = await composio.provider.handleToolCalls(userId, msg);
  return result;
}

/**
 * Example 3: Multi-platform posting (Twitter + Reddit)
 */
export async function autoPostMultiPlatform(
  userId: string,
  companyInfo: string,
  announcement: string,
  subreddit: string
) {
  // Get both Twitter and Reddit tools
  const tools = await composio.tools.get(userId, {
    toolkits: ["TWITTER", "REDDIT"],
    limit: 20,
  });

  // Ask Claude to create platform-specific posts
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    tools: tools,
    messages: [
      {
        role: "user",
        content: `You are the social media manager for ${companyInfo}.

We have an announcement: ${announcement}

Your task:
1. Create and post an engaging tweet about this announcement (use TWITTER_POST_TWEET)
2. Create and post a detailed Reddit post to r/${subreddit} (use REDDIT_SUBMIT_POST)

Adapt the content for each platform:
- Twitter: Short, engaging, with hashtags and emojis
- Reddit: Detailed, conversational, community-focused

Execute both posts.`,
      },
    ],
    max_tokens: 4000,
  });

  // Handle tool calls
  const result = await composio.provider.handleToolCalls(userId, msg);
  return result;
}

/**
 * Example 4: Intelligent response to Reddit comments
 */
export async function respondToRedditMentions(
  userId: string,
  companyInfo: string
) {
  // Get Reddit tools
  const tools = await composio.tools.get(userId, {
    toolkits: ["REDDIT"],
    limit: 15,
  });

  // Ask Claude to find and respond to mentions
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    tools: tools,
    messages: [
      {
        role: "user",
        content: `You are the community manager for ${companyInfo}.

Task:
1. Search for recent mentions of our company in relevant subreddits
2. Read the context of each mention
3. If appropriate, respond with a helpful, authentic comment
4. Be conversational, not promotional

Use the available Reddit tools to:
- Search for mentions
- Read post/comment details
- Reply where it makes sense`,
      },
    ],
    max_tokens: 4000,
  });

  // Handle tool calls
  const result = await composio.provider.handleToolCalls(userId, msg);
  return result;
}

/**
 * Example 5: Scheduled content calendar automation
 */
export async function scheduledMarketingPost(
  userId: string,
  projectSettings: {
    brandName: string;
    description: string;
    keywords: string;
    persona: string;
  }
) {
  // Get both platforms
  const tools = await composio.tools.get(userId, {
    toolkits: ["TWITTER", "REDDIT"],
    limit: 20,
  });

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    tools: tools,
    messages: [
      {
        role: "user",
        content: `You are the AI marketing agent for ${projectSettings.brandName}.

Company details:
- Name: ${projectSettings.brandName}
- Description: ${projectSettings.description}
- Keywords: ${projectSettings.keywords}
- Brand persona: ${projectSettings.persona}

Create and post marketing content to both Twitter and Reddit:

1. Create an engaging tweet that:
   - Highlights our product value
   - Uses our keywords naturally
   - Matches our brand persona
   - Is under 280 characters
   - Post it using TWITTER_POST_TWEET

2. Create a Reddit post for r/startups that:
   - Shares a valuable insight related to our industry
   - Subtly mentions our solution
   - Provides genuine value to the community
   - Post it using REDDIT_SUBMIT_POST

Execute both posts now.`,
      },
    ],
    max_tokens: 4000,
  });

  const result = await composio.provider.handleToolCalls(userId, msg);
  return result;
}

/**
 * Example 6: Monitor and engage with trending topics
 */
export async function engageWithTrendingTopics(
  userId: string,
  companyInfo: string,
  watchedKeywords: string[]
) {
  const tools = await composio.tools.get(userId, {
    toolkits: ["TWITTER", "REDDIT"],
    limit: 20,
  });

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    tools: tools,
    messages: [
      {
        role: "user",
        content: `You are the social media analyst for ${companyInfo}.

Monitored keywords: ${watchedKeywords.join(", ")}

Your task:
1. Search Twitter for recent tweets mentioning these keywords
2. Search Reddit for relevant discussions
3. Identify opportunities to add value to the conversation
4. Post thoughtful responses or quote-tweet where appropriate
5. Always be helpful, never spammy

Use the available tools to:
- Search for keyword mentions
- Read the context
- Engage authentically`,
      },
    ],
    max_tokens: 5000,
  });

  const result = await composio.provider.handleToolCalls(userId, msg);
  return result;
}

// Export helper to check if user has required connections
export async function checkUserConnections(userId: string) {
  const connections = await composio.connectedAccounts.list({
    userIds: [userId],
    statuses: ["ACTIVE"],
  });

  const hasTwitter = connections.items.some((conn) =>
    conn.integrationId.toLowerCase().includes("twitter")
  );

  const hasReddit = connections.items.some((conn) =>
    conn.integrationId.toLowerCase().includes("reddit")
  );

  return {
    hasTwitter,
    hasReddit,
    canAutomate: hasTwitter || hasReddit,
    connections: connections.items,
  };
}

