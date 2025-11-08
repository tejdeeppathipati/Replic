---
title: Authenticating Tools
image:
  type: url
  value: 'https://og.composio.dev/api/og?title=Authenticating%20Tools'
keywords: 'auth config, authentication, oauth, api key, user authentication'
subtitle: Create auth configs and connect user accounts
hide-nav-links: false
---

The first step in authenticating your Users is to create an **Auth Config**. Every toolkit has its own _authentication method_ such as **OAuth**, **API key**, **Basic Auth**, or custom schemes.

An **Auth Config** is a _blueprint_ that defines how authentication works for a toolkit across all your users. It defines:

1. **Authentication method** - _OAuth2_, _Bearer token_, _API key_, or _Basic Auth_
2. **Scopes** - _what actions your tools can perform_
3. **Credentials** - _whether you'll use your own app credentials or Composio's managed auth_

<Frame>
  <img src="file:4668b258-685d-4105-afef-309febec9dd1" alt="Composio introduction image" />
</Frame>

## Creating an auth config

### Using the Dashboard

<Steps>
  <Step title="**Selecting a toolkit**">
    Navigate to <a target="_blank"href="https://platform.composio.dev?next_page=%2Fauth-configs"target="_blank">Auth Configs</a> tab in your dashboard and click "**Create Auth Config**". Find and select the toolkit you want to integrate (e.g., **Gmail**, **Slack**, **GitHub**).
  </Step>
  <Step title="**Selecting the Authentication method**">
    Each toolkit supports different authentication methods such as **OAuth**, **API Key**, **Bearer
    Token**. Select from the available options for your toolkit.
  </Step>
  <Step title="**Configure scopes**">
    Depending on your authentication method, you may need to configure scopes: 
    - **OAuth2**: Configure scopes for what data and actions your integration can access. 
    - **API Key/Bearer Token**: Permissions are typically fixed based on the key's access level.
  </Step>
  <Step title="**Authentication Management**">
    **For OAuth toolkits:** 
      - **Development/Testing**: Use Composio's managed authentication (no setup required) 
      - **Production**: Generate your own OAuth credentials from the toolkit's developer portal 
    
    **For custom authentication schemes:** 
    
    You must provide your own credentials regardless of environment.
  </Step>
  <Step title="**You are all set!**">
    Click "**Create Auth Configuration**" button and you have completed your first step! Now you can
    move ahead to authenticating your users by [Connecting an Account](#connecting-an-account).
  </Step>
</Steps>

<Note title="Auth configs are reusable">
  Auth configs contain your developer credentials and app-level settings (*scopes*, *authentication
  method*, etc.). Once created, you can reuse the same auth config for all your users.
</Note>

### When to create multiple auth configs?

You should create multiple auth configs for the same toolkit when you need:

- **Different authentication methods** - One OAuth config and one API key config
- **Different scopes** - Separate configs for read-only vs full access
- **Different OAuth apps** - Using separate client credentials for different environments
- **Different permission levels** - Limiting actions for specific use cases

<Card title="Programmatic creation" href="/docs/programmatic-auth-configs" icon="fa-solid fa-code">
  For managing auth configs across multiple projects, you can create them programmatically via the
  API
</Card>

## Connecting an account

With an auth config created, you're ready to authenticate your users!

You can either use [**Connect Link**](#hosted-authentication-connect-link) for a hosted authentication flow, or use [**Direct SDK Integration**](#direct-sdk-integration).

<Note>
User authentication requires a User ID - a unique identifier that groups connected accounts together. Learn more about [User Management](/docs/user-management) to understand how to structure User IDs for your application.
</Note> 

**Choose the section below that matches your toolkit's authentication method:**

### Hosted Authentication (Connect Link)

Redirect users to a Composio-hosted URL that handles the entire authentication process—OAuth flows, API key collection, or custom fields like subdomain. You can specify a callback URL to control where users return after authentication.

<Frame caption="Connect Link authentication screen">
  <img 
    src="file:dc79c61f-e003-40a2-88b8-77635b793ae1" 
    alt="Composio authentication screen showing Gmail connection"
    style={{ maxWidth: '350px', maxHeight: '400px', width: 'auto', height: 'auto', margin: '0 auto', display: 'block' }}
  />
</Frame>

<CodeGroup>
```python Python {11-15} title="Python" maxLines=40 
from composio import Composio

composio = Composio(api_key="your_api_key")

# Use the "AUTH CONFIG ID" from your dashboard
auth_config_id = "your_auth_config_id"

# Use a unique identifier for each user in your application
user_id = 'user-1349-129-12'

connection_request = composio.connected_accounts.link(
    user_id=user_id, 
    auth_config_id=auth_config_id, 
    callback_url='https://your-app.com/callback'
)

redirect_url = connection_request.redirect_url
print(f"Visit: {redirect_url} to authenticate your account")
            
# Wait for the connection to be established
connected_account = connection_request.wait_for_connection()
print(connected_account.id)
```

```typescript TypeScript {11-13} title="TypeScript" maxLines=40 
import { Composio } from '@composio/core';

const composio = new Composio({apiKey: "your_api_key"});

// Use the "AUTH CONFIG ID" from your dashboard
const authConfigId = 'your_auth_config_id';

// Use a unique identifier for each user in your application
const userId = 'user-1349-129-12';

const connectionRequest = await composio.connectedAccounts.link(userId, authConfigId, {
  callbackUrl: 'https://your-app.com/callback'
});
const redirectUrl = connectionRequest.redirectUrl;
console.log(`Visit: ${redirectUrl} to authenticate your account`);

// Wait for the connection to be established
const connectedAccount = await connectionRequest.waitForConnection();
console.log(connectedAccount.id);
```
</CodeGroup>

#### Customizing Connect Link

By default, users will see a Composio-branded authentication experience when connecting their accounts. To customize this interface with your application's branding:

1. Navigate to your Project Settings and select [Auth Screen](https://platform.composio.dev?next_page=/settings/auth-screen)
2. Configure your **Logo** and **App Title**

These settings will apply to all authentication flows using Connect Link, providing a white-labeled experience that maintains your brand identity throughout the authentication process.



### Direct SDK Integration

**Choose the section below that matches your toolkit's authentication method:**

#### OAuth Connections

For OAuth flows, you'll redirect users to complete authorization. You can specify a callback URL to control
where users return after authentication:

<CodeGroup>
```python Python {11-16}
from composio import Composio

composio = Composio(api_key="YOUR_COMPOSIO_API_KEY")

# Use the "AUTH CONFIG ID" from your dashboard
auth_config_id = "your_auth_config_id"

# Use a unique identifier for each user in your application
user_id = "user-1349-129-12"

connection_request = composio.connected_accounts.initiate(
  user_id=user_id,
  auth_config_id=auth_config_id,
  config={"auth_scheme": "OAUTH2"},
  callback_url="https://www.yourapp.com/callback"
)
print(f"Redirect URL: {connection_request.redirect_url}")

connected_account = connection_request.wait_for_connection()

# Alternative: if you only have the connection request ID
# connected_account = composio.connected_accounts.wait_for_connection(
#  connection_request.id)
# Recommended when the connection_request object is no longer available

print(f"Connection established: {connected_account.id}")

````

```typescript {10-16}
import { Composio } from '@composio/core';

const composio = new Composio({apiKey: "YOUR_COMPOSIO_API_KEY"});

// Use the "AUTH CONFIG ID" from your dashboard
const authConfigId = 'your_auth_config_id';
// Use a unique identifier for each user in your application
const userId = 'user_4567';

const connRequest = await composio.connectedAccounts.initiate(
  userId,
  authConfigId,
  {
    callbackUrl: 'https://www.yourapp.com/callback',
  }
);
console.log(`Redirect URL: ${connRequest.redirectUrl}`);

const connectedAccount = await connRequest.waitForConnection();

// Alternative: if you only have the connection request ID
// const connectedAccount = await composio.connectedAccounts
//   .waitForConnection(connRequest.id);
// Recommended when the connRequest object is no longer available

console.log(`Connection established: ${connectedAccount.id}`);
````

</CodeGroup>

#### Services with Additional Parameters

Some services like Zendesk require additional parameters such as `subdomain`:

<CodeGroup>
```python
# For Zendesk - include subdomain
connection_request = composio.connected_accounts.initiate(
  user_id=user_id,
  auth_config_id=auth_config_id,
  config=auth_scheme.oauth2(subdomain="mycompany")  # For mycompany.zendesk.com
)
```

```typescript
import { AuthScheme } from '@composio/core';
// For Zendesk - include subdomain
const connRequest = await composio.connectedAccounts.initiate(userId, authConfigId, {
  config: AuthScheme.OAuth2({
    subdomain: 'mycompany',
  }),
});
```

</CodeGroup>

#### API Key Connections

For API key authentication, you can either _collect API keys from each user_ or _use your own API key_ for all users. Popular Toolkits that use API Keys include Stripe, Perplexity etc.

Here is how to initiate the flow:

<CodeGroup>
```python {16-22}
from composio import Composio

composio = Composio(api_key="your_api_key")

# Use the "AUTH CONFIG ID" from your dashboard
auth_config_id = "your_auth_config_id"

# Use a unique identifier for each user in your application
user_id = "user_12323"

# API key provided by the user (collected from your app's UI)
# or use your own key
user_api_key = "user_api_key_here"

connection_request = composio.connected_accounts.initiate(
  user_id=user_id,
  auth_config_id=auth_config_id,
  config={
    "auth_scheme": "API_KEY", "val": {"api_key": user_api_key}
  }
)

print(f"Connection established: {connection_request.id}")

````

```typescript {12-16}
import { Composio, AuthScheme } from '@composio/core';

const composio = new Composio({ apiKey: 'your_api_key' });

// Use the "AUTH CONFIG ID" from your dashboard
const authConfigId = 'your_auth_config_id';
// Use a unique identifier for each user in your application
const userId = 'user12345678';
// API key provided by the user (collected from your app's UI)
const userApiKey = 'user_api_key_here';

const connectionRequest = await composio.connectedAccounts.initiate(userId, authConfigId, {
  config: AuthScheme.APIKey({
    api_key: userApiKey,
  }),
});

console.log(`Connection established: ${connectionRequest.id}`);
````

</CodeGroup>

## Fetching the required `config` parameters for an Auth Config

When working with any toolkits, you can **inspect an auth config** to understand its _authentication requirements_ and _expected parameters_.

Here is how you would fetch the authentication method and input fields:

<CodeGroup>
```python {9}
from composio import Composio

composio = Composio(api_key="your_api_key")

# Use the "AUTH CONFIG ID" from your dashboard
auth_config_id = "your_auth_config_id"

# Fetch the auth configuration details
auth_config = composio.auth_configs.get(auth_config_id)

# Check what authentication method this config uses
print(f"Authentication method: {auth_config.auth_scheme}")

# See what input fields are required
print(f"Required fields: {auth_config.expected_input_fields}")

````

```typescript {9}
import { Composio } from '@composio/core';

const composio = new Composio({ apiKey: 'your_api_key' });

// Use the "AUTH CONFIG ID" from your dashboard
const authConfigId = 'your_auth_config_id';

// Fetch the auth configuration details
const authConfig = await composio.authConfigs.get(authConfigId);

console.log(`Authentication method: ${authConfig.authScheme}`);
console.log(`Required fields:`, authConfig.expectedInputFields);
````

</CodeGroup>

## Other Authentication Methods

Composio also supports a wide range of other auth schemas:

**Bearer Token** - Similar to API keys, provide the user's bearer token directly when creating the connection.

**Basic Auth** - Provide username and password credentials for services that use HTTP Basic Authentication.

**Custom Schemes** - Some toolkits use their own custom authentication methods. Follow the toolkit-specific requirements for such cases.

<Note title="Fetching auth config">
  For any of these methods, [fetch the config
  parameter](#fetching-the-required-config-parameters-for-an-auth-config) to determine the exact
  fields required. Every toolkit has its own requirements, and understanding these is essential for
  successfully creating connections.
</Note>

## Connection Statuses

After creating a connection, it will have one of the following statuses that indicates its current state:

| Status | Description |
|--------|-------------|
| **ACTIVE** | Connection is established and working. You can execute tools with this connection. |
| **INACTIVE** | Connection is temporarily disabled. Re-enable it to use the connection again. |
| **PENDING** | Connection is being processed. Wait for it to become active. |
| **INITIATED** | Connection request has started but not yet completed. User may still need to complete authentication. |
| **EXPIRED** | Connection credentials have expired. Composio automatically attempts to refresh credentials before marking as expired. Re-authenticate to restore access. |
| **FAILED** | Connection attempt failed. Check error details and try creating a new connection. |

<Note>
When credentials expire for OAuth connections, Composio automatically attempts to refresh them using the refresh token. The connection is only marked as **EXPIRED** after multiple refresh attempts have failed. 
</Note>

### Waiting for Connection Establishment

The `waitForConnection` method allows you to poll for a connection to become active after initiating authentication. This is useful when you need to ensure a connection is ready before proceeding.

<CodeGroup>
```python Python title="Python" maxLines=40 
# Wait for the connection to be established
connected_account = connection_request.wait_for_connection()
print(connected_account.id)

# Alternative: Wait with custom timeout
# connected_account = connection_request.wait_for_connection(120)  # 2 minute timeout

# Alternative: If you only have the connection request ID (e.g., stored in database)
# connection_id = connection_request.id  # You can store this ID in your database
# connected_account = composio.connected_accounts.wait_for_connection(connection_id, 60)
```

```typescript TypeScript title="TypeScript" maxLines=40 
// Wait for the connection to be established
const connectedAccount = await connectionRequest.waitForConnection();
console.log(connectedAccount.id);

// Alternative: Wait with custom timeout
// const connectedAccount = await connectionRequest.waitForConnection(120000);  // 2 minutes

// Alternative: If you only have the connection request ID (e.g., stored in database)
// const connectionId = connectionRequest.id;  // You can store this ID in your database
// const connectedAccount = await composio.connectedAccounts.waitForConnection(connectionId, 60000);
```
</CodeGroup>

The method continuously polls the Composio API until the connection:
- Becomes **ACTIVE** (returns the connected account)
- Enters a terminal state like **FAILED** or **EXPIRED** (throws an error)
- Exceeds the specified timeout (throws a timeout error)

### Checking Connection Status

You can check the status of a connected account programmatically:

<CodeGroup>
```python Python title="Python" maxLines=40 
# Get a specific connected account
connected_account = composio.connected_accounts.get("your_connected_account_id")
print(f"Status: {connected_account.status}")

# Filter connections by user_id, auth_config_id, and status (only active accounts)
filtered_connections = composio.connected_accounts.list(
    user_ids=["user_123"],
    auth_config_ids=["your_auth_config_id"],
    statuses=["ACTIVE"]
)
for connection in filtered_connections.items:
    print(f"{connection.id}: {connection.status}")
```
```typescript TypeScript title="Typescript" maxLines=40 
// Get a specific connected account by its nanoid
const connectedAccount = await composio.connectedAccounts.get('your_connected_account_id');
console.log(`Status: ${connectedAccount.status}`);

// Filter connections by user_id, auth_config_id, and status (only active accounts)
const filteredConnections = await composio.connectedAccounts.list({
  userIds: ['user_123'],
  authConfigIds: ['your_auth_config_id'],
  statuses: ['ACTIVE']
});
filteredConnections.items.forEach(connection => {
  console.log(`${connection.id}: ${connection.status}`);
});
```
</CodeGroup>

<Note>
Only connections with **ACTIVE** status can be used to execute tools. If a connection is in any other state, you'll need to take appropriate action (re-authenticate, wait for processing, etc.) before using it.
</Note>

## Next Step

With authentication set up, you can now fetch and execute tools. See [Executing Tools](/docs/executing-tools) to get started.


---
title: Fetching and Filtering Tools
image:
  type: url
  value: 'https://og.composio.dev/api/og?title=Fetching%20and%20Filtering%20Tools'
keywords: 'fetch tool, filter tool'
subtitle: Learn how to fetch and filter Composio's tools and toolsets
hide-nav-links: false
---

To effectively use tools, it is recommended to fetch, inspect, and filter them based on your criteria. 

This process returns a union of all tools that match the specified criteria, ensuring you provide the most relevant tools to the agents.

When fetching tools, they are automatically formatted to match the requirements of the provider you are using. This means you do not need to manually convert or adapt the tool format.

## Filtering by toolkit
Toolkits are collections of tools from a specific app!

Fetching tools from a toolkit is a good way to get a sense of the tools available.

<Tip title="Tools are ordered by importance" icon="info">
When you fetch tools from a toolkit, the most important tools are returned first.

Composio determines the importance of a tool based on the usage and relevance of the tool.
</Tip>

<CodeGroup>
```python Python maxLines=60 wordWrap
tools = composio.tools.get(
    user_id,
    toolkits=["GITHUB", "HACKERNEWS"],
)
```

```typescript TypeScript maxLines=60 wordWrap
const tools = await composio.tools.get(
  userId,
  {
    toolkits: ["GITHUB", "LINEAR"],
  }
);
```
</CodeGroup>

**Limiting the results**

Multiple toolkits have 100s of tools. These can easily overwhelm the LLM. Hence, the SDK allows you to limit the number of tools returned.

The default `limit` is 20 -- meaning you get the top 20 important tools from the toolkit.

<CodeGroup>
```python Python maxLines=60 wordWrap
tools = composio.tools.get(
    user_id,
    toolkits=["GITHUB"],
    limit=5,  # Returns the top 5 important tools from the toolkit
)
```
```typescript TypeScript maxLines=60 wordWrap
const tools = await composio.tools.get(userId, {
  toolkits: ["GITHUB"],
  limit: 5, // Returns the top 5 important tools from the toolkit
});
```
</CodeGroup>

**Filtering by scopes**

When working with OAuth-based toolkits, you can filter tools based on their required scopes. This is useful when you want to:
- Get tools that match specific permission levels
- Ensure tools align with available user permissions
- Filter tools based on their required OAuth scopes

<Tip title="Single Toolkit Requirement" icon="warning">
Scope filtering can only be used with a single toolkit at a time.
</Tip>

<CodeGroup>
```python Python maxLines=60 wordWrap
# Get GitHub tools that require specific scopes
tools = composio.tools.get(
    user_id,
    toolkits=["GITHUB"],
    scopes=["repo"],  # Only get tools requiring these scopes
    limit=10
)
```
```typescript TypeScript maxLines=60 wordWrap
// Get GitHub tools that require specific scopes
const tools = await composio.tools.get(userId, {
  toolkits: ["GITHUB"],
  scopes: ["repo"],  // Only get tools requiring these scopes
  limit: 10
});
```
</CodeGroup>

## Tool versions

You can configure toolkit versions at SDK initialization to ensure consistent tool behavior across environments. When fetching tools, you can also [inspect which version each tool is using](/docs/toolkit-versioning#inspect-current-versions).

## Filtering by tool
You may specify the list of tools to fetch by directly providing the tool names. Browse the list of tools [here](/tools) to view and inspect the tools for each toolkit.

<CodeGroup>

```python Python maxLines=60 wordWrap
tools = composio.tools.get(
    user_id,
    tools=[
        "GITHUB_CREATE_AN_ISSUE",
        "GITHUB_CREATE_AN_ISSUE_COMMENT",
        "GITHUB_CREATE_A_COMMIT",
    ],
)
```

```typescript TypeScript maxLines=60 wordWrap
const tools = await composio.tools.get(userId, {
  tools: [
    "GITHUB_CREATE_AN_ISSUE",
    "GITHUB_CREATE_AN_ISSUE_COMMENT",
    "GITHUB_CREATE_A_COMMIT",
  ],
});
```
</CodeGroup>

## Fetching raw tools
To examine the raw schema definition of a tool to understand the input/output parameters or to build custom logic around tool definitions, you can use the following methods. This can be useful for:
- Understanding exact input parameters and output structures.
- Building custom logic around tool definitions.
- Debugging tool interactions.
- Research and experimentation.

<CodeGroup>
```python Python title="Python" maxLines=40 
tool = composio.tools.get_raw_composio_tool_by_slug("HACKERNEWS_GET_LATEST_POSTS")

print(tool.model_dump_json())
```
```typescript TypeScript title="TypeScript" maxLines=40 
const tool = await composio.tools.getRawComposioToolBySlug('GITHUB_GET_OCTOCAT');

console.log(JSON.stringify(tool, null, 2));
```
</CodeGroup>


## Filtering by search (Experimental)
You may also filter tools by searching for them. This is a good way to find tools that are relevant to a given use case.

This step runs a semantic search on the tool names and descriptions and returns the most relevant tools.

<CodeGroup>
```python Python maxLines=60 wordWrap
tools = composio.tools.get(
    user_id,
    search="hubspot organize contacts",
)

# Search within a specific toolkit
tools = composio.tools.get(
    user_id,
    search="repository issues",
    toolkits=["GITHUB"],  # Optional: limit search to specific toolkit
    limit=5  # Optional: limit number of results
)
```

```typescript TypeScript maxLines=60 wordWrap
const tools = await composio.tools.get(userId, {
  search: "hubspot organize contacts",
});

// Search within a specific toolkit
const tools = await composio.tools.get(userId, {
  search: "repository issues",
  toolkits: ["GITHUB"],  // Optional: limit search to specific toolkit
  limit: 5  // Optional: limit number of results
});
```
</CodeGroup>

## Filter Combinations

When fetching tools, you must use one of these filter combinations:

1. **Tools Only**: Fetch specific tools by their slugs
   ```typescript
   { tools: ["TOOL_1", "TOOL_2"] }
   ```

2. **Toolkits Only**: Fetch tools from specific toolkits
   ```typescript
   { toolkits: ["TOOLKIT_1", "TOOLKIT_2"], limit?: number }
   ```

3. **Single Toolkit with Scopes**: Fetch tools requiring specific OAuth scopes
   ```typescript
   { toolkits: ["GITHUB"], scopes: ["read:repo"], limit?: number }
   ```

4. **Search**: Search across all tools or within specific toolkits
   ```typescript
   { search: "query", toolkits?: string[], limit?: number }
   ```

These combinations are mutually exclusive - you can't mix `tools` with `search` or use `scopes` with multiple toolkits.


---
title: Executing Tools
image:
  type: url
  value: 'https://og.composio.dev/api/og?title=Executing%20Tools'
keywords: ''
subtitle: Learn how to execute Composio's tools with different providers and frameworks
hide-nav-links: false
---

LLMs on their own can only do generation. Tool calling changes that by letting them interact with external services. Instead of just drafting an email, the model can call `GMAIL_SEND_EMAIL` to actually send it. The tool's results feed back to the LLM, closing the loop so it can decide, _act,_ observe, and adapt.

In Composio, every **tool** is a single API action—fully described with schema, parameters, and return type. Tools live inside **toolkits** like _Gmail, Slack, or GitHub_, and Composio handles authentication and user scoping.

<Tip icon="info">
  **User Scoping**: All tools are scoped to a specific user - that's why every example includes a
  `user_id`. Learn how to structure User IDs in [User Management](./user-management). Each user must authenticate with their respective services (Gmail, Calendar, etc.) - see [Authentication](./authenticating-tools)
</Tip>

## Using Chat Completions

Use the Composio SDK with providers like OpenAI, Anthropic, and Google AI. To learn how to set-up these providers, see [Providers](/providers/openai).

<CodeGroup>
  ```python Python {32-33} title="Python (OpenAI)" maxLines=40 
from composio import Composio
from composio_openai import OpenAIProvider
from openai import OpenAI
from datetime import datetime

# Use a unique identifier for each user in your application
user_id = "user-k7334" 

# Create composio client
composio = Composio(provider=OpenAIProvider(), api_key="your_composio_api_key")

# Create openai client
openai = OpenAI()
  
# Get calendar tools for this user
tools = composio.tools.get(
    user_id=user_id,
    tools=["GOOGLECALENDAR_EVENTS_LIST"]
)

# Ask the LLM to check calendar
result = openai.chat.completions.create(
    model="gpt-4o-mini",
    tools=tools,
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": f"What's on my calendar for the next 7 days. Its {datetime.now().strftime("%Y-%m-%d")} today.",}
    ]
)


# Handle tool calls
result = composio.provider.handle_tool_calls(user_id=user_id, response=result)
print(result)
```
  ```typescript TypeScript {37-38} title="TypeScript (Anthropic)" maxLines=40 
import { Composio } from '@composio/core';
import { AnthropicProvider } from '@composio/anthropic';
import { Anthropic } from '@anthropic-ai/sdk';

// Use a unique identifier for each user in your application
const userId = 'user-k7334';

// Create anthropic client
const anthropic = new Anthropic();

// Create Composio client
const composio = new Composio({
  apiKey: "your-composio-api-key",
  provider: new AnthropicProvider(),
});

// Get calendar tools for this user
const tools = await composio.tools.get(userId, {
  tools: ['GOOGLECALENDAR_EVENTS_LIST'],
});

const today = new Date();

// Ask the LLM to check calendar
const msg = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  tools: tools,
  messages: [
    {
      role: 'user',
      content: `What's on my calendar for the next 7 days starting today:${today.toLocaleDateString()}?`,
    },
  ],
  max_tokens: 1024,
});

// Handle tool calls
const result = await composio.provider.handleToolCalls(userId, msg);
console.log('Results:', JSON.stringify(result, null, 2));

```
</CodeGroup>

## Using Agentic Frameworks

Agentic frameworks automatically handle the tool execution loop.
Composio provides support for frameworks like this by making sure the tools are formatted into the correct objects for the agentic framework to execute.

<CodeGroup>
  ```python Python {19-23} title="Python (OpenAI Agents SDK)" maxLines=40 
import asyncio
from agents import Agent, Runner
from composio import Composio
from composio_openai_agents import OpenAIAgentsProvider

# Use a unique identifier for each user in your application
user_id = "user-k7334"

# Initialize Composio toolset
composio = Composio(provider=OpenAIAgentsProvider(), api_key="your_composio_api_key")

# Get all tools for the user
tools = composio.tools.get(
    user_id=user_id,
    toolkits=["COMPOSIO_SEARCH"],
)

# Create an agent with the tools
agent = Agent(
    name="Deep Researcher",
    instructions="You are an investigative journalist.",
    tools=tools,
)

async def main():
    result = await Runner.run(
        starting_agent=agent,
        input=("Do a thorough DEEP research on Golden Gate Bridge"),
    )
    print(result.final_output)

# Run the agent
asyncio.run(main())

```
  ```typescript TypeScript {22-31} title="TypeScript (Vercel AI SDK)" maxLines=40 
import { Composio } from '@composio/core';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { VercelProvider } from '@composio/vercel';

// Use a unique identifier for each user in your application
const userId = 'user-k7334';

// Initialize Composio toolset
const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new VercelProvider(),
});

// Get all tools for the user
const tools = await composio.tools.get(userId, {
  toolkits: ['HACKERNEWS_GET_LATEST_POSTS'],
  limit: 10,
});

// Generate a deep research on hackernews
const { text } = await generateText({
  model: anthropic('claude-sonnet-4-20250514'),
  messages: [
    {
      role: 'user',
      content: 'Do a thorough DEEP research on the top articles on Hacker News about Composio',
    },
  ],
  tools,
});

console.log(text);

```
</CodeGroup>

## Direct Tool execution

In case you just want to call a tool without using any framework or LLM provider, you can use the `execute` method directly.

<Tip icon="lightbulb">
  **Finding tool parameters and types:** 
  
  **Platform UI**: [Auth Configs](https://platform.composio.dev?next_page=/auth-configs) → Select your toolkit → Tools & Triggers → Select the tool to see its required and optional parameters
  
  **CLI**: For python and typescript projects, run `composio generate` to generate types. [Learn more →](/docs/cli#generate-type-definitions)
</Tip>

<CodeGroup>
  ```python Python title="Python" maxLines=40 
from composio import Composio

user_id = "user-k7334"
# Configure toolkit versions at SDK level
composio = Composio(
    api_key="your_composio_key",
    toolkit_versions={"github": "20251027_00"}
)

# Find available arguments for any tool in the Composio dashboard
result = composio.tools.execute(
    "GITHUB_LIST_STARGAZERS",
    user_id=user_id,
    arguments={"owner": "ComposioHQ", "repo": "composio", "page": 1, "per_page": 5}
)
print(result)
```
  ```typescript TypeScript title="TypeScript" maxLines=40 
import { Composio } from "@composio/core";

const userId = "user-k7334";
// Configure toolkit versions at SDK level
const composio = new Composio({
    apiKey: "your_composio_key",
    toolkitVersions: { github: "20251027_00" }
});

// Find available arguments for any tool in the Composio dashboard
const result = await composio.tools.execute("GITHUB_LIST_STARGAZERS", {
  userId,
  arguments: {
    "owner": "ComposioHQ", 
    "repo": "composio", 
    "page": 1, 
    "per_page": 5
  },
});
console.log('GitHub stargazers:', JSON.stringify(result, null, 2));
```
</CodeGroup>

<Note>
The examples above configure toolkit versions at SDK initialization. You can also pass versions per-execution or use environment variables. See [toolkit versioning](/docs/toolkit-versioning) for all configuration options.
</Note>

### Proxy Execute -- Manually calling toolkit APIs

You can proxy requests to any supported toolkit API and let Composio inject the **authentication state**. This is useful when you need an API endpoint that isn't available as a predefined tool.

The `endpoint` can be a relative path or absolute URL. Composio uses the `connected_account_id` to determine the toolkit and resolve relative paths against the appropriate base URL.

<CodeGroup>
  ```python Python {5} title="Python" maxLines=40 
# Send a proxy request to the endpoint
response = composio.tools.proxy(
    endpoint="/repos/composiohq/composio/issues/1",
    method="GET",
    connected_account_id="ca_jI6********",  # use connected account for github
    parameters=[
        {
            "name": "Accept",
            "value": "application/vnd.github.v3+json",
            "type": "header",
        },
    ],
)

print(response)

```
  ```typescript TypeScript {5} title="TypeScript" maxLines=40 
// Send a proxy request to the endpoint
const { data } = await composio.tools.proxyExecute({
    endpoint:'/repos/composiohq/composio/issues/1',
    method: 'GET',
    connectedAccountId: 'ca_jI*****', // use connected account for github
     parameters:[
        {
            "name": "Accept",
            "value": "application/vnd.github.v3+json",
            "in": "header",
        },
    ],
});

console.log(data);
  
```

</CodeGroup>

<Tip icon="info">
  Need an API that isn't supported by any Composio toolkit, or want to extend an existing one? Learn
  how to [create custom tools](/docs/custom-tools).
</Tip>

## Automatic File Handling

Composio handles file operations automatically. Pass file paths to tools that need them, and get local file paths back from tools that return files.

### File Upload

Pass local file paths, URLs, or File objects to tools that accept files:

<CodeGroup>
  ```python Python title="Python" maxLines=40 
# Upload a local file to Google Drive
result = composio.tools.execute(
    slug="GOOGLEDRIVE_UPLOAD_FILE",
    user_id="user-1235***",
    arguments={"file_to_upload": os.path.join(os.getcwd(), "document.pdf")},  # Local file path
)

print(result)  # Print Google Drive file details

```
  ```typescript TypeScript title="TypeScript" maxLines=40 
// Upload a local file to Google Drive
const result = await composio.tools.execute('GOOGLEDRIVE_UPLOAD_FILE', {
  userId: 'user-4235***',
  arguments: {
    file_to_upload: path.join(__dirname, 'document.pdf')  // Local file path
  }
});

console.log(result.data);  // Contains Google Drive file details

```
</CodeGroup>

### File Download

When tools return files, Composio downloads them to the local directory and provides file path in the response:
When tools return files, Composio downloads them to the local directory and provides the file path in the response:

<CodeGroup>
  ```python Python title="Python" maxLines=40 
composio = Composio(
    api_key="your_composio_key", file_download_dir="./downloads"
)  # Optional: Specify the directory to download files to

result = composio.tools.execute(
    "GOOGLEDRIVE_DOWNLOAD_FILE",
    user_id="user-1235***",
    arguments={"file_id": "your_file_id"},
)

# Result includes local file path
print(result)

```
  ```typescript TypeScript title="TypeScript" maxLines=40 
// Download a file from Google Drive
const result = await composio.tools.execute('GOOGLEDRIVE_DOWNLOAD_FILE', {
    userId: 'user-1235***',
    arguments: {
      file_id: 'your-file-id'
    }
  });
  
// Result includes local file path
console.log(result);
```

</CodeGroup>

### Disabling Auto File Handling

You can disable automatic file handling when initializing the TypeScript SDK. When disabled, handle file uploads and downloads manually using `files.upload` and `files.download`:

<CodeGroup>
```typescript TypeScript maxLines=60 wordWrap
const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  autoUploadDownloadFiles: false
});

// Now you need to handle files manually using composio.files API
const fileData = await composio.files.upload({
filePath: path.join(\_\_dirname, 'document.pdf'),
toolSlug: 'GOOGLEDRIVE_UPLOAD_FILE',
toolkitSlug: 'googledrive'
});

```
</CodeGroup>

```
---
title: User Management
image:
  type: url
  value: 'https://og.composio.dev/api/og?title=User%20Management'
keywords: 'user management, user Id, user context, external user ID'
subtitle: Manage users and their connected accounts
hide-nav-links: false
---

## What are User IDs?
User IDs determine whose connected accounts and data you're accessing in Composio. Every tool execution, connection authorization, and account operation
requires a `userId` parameter that identifies which context to use.

User IDs act as containers that group connected accounts together across toolkits. Depending on your application, you can use User IDs to represent an
individual user, a team, or an entire organization.

## Quick Decision Guide

**How do users access connected accounts in your app?**

- **Each user connects their own personal accounts?**  
Use User IDs  
*Use your database UUID or primary key (e.g., `user.id`)*  
*Example: Users connect their personal Gmail, GitHub*

- **Teams share the same connected accounts?**  
Use Organization IDs  
*Use your organization UUID or primary key (e.g., `organization.id`)*  
*Example: Company Slack workspace*

## Patterns

### User IDs (Individual Accounts)

In production applications with multiple users, where each user connects and manages their own accounts.

**Choosing User IDs:**

- Recommended: Database UUID or primary key (`user.id`)
- Acceptable: Unique username (`user.username`)
- Avoid: Email addresses (emails can change)

<CodeGroup>
```typescript Typescript
// Use your database's user ID (UUID, primary key, etc.)
const userId = user.id; // e.g., "550e8400-e29b-41d4-a716-446655440000"

const tools = await composio.tools.get(userId, {
  toolkits: ['github'],
});

const result = await composio.tools.execute('GITHUB_GET_REPO', {
  userId: userId,
  arguments: { owner: 'example', repo: 'repo' },
});
```

```python Python
# Use your database's user ID (UUID, primary key, etc.)
user_id = user.id; # e.g., "550e8400-e29b-41d4-a716-446655440000"

tools = composio.tools.get(
  user_id=user_id,
  toolkits=["GITHUB"],
)

result = composio.tools.execute(
  "GITHUB_GET_REPO",
  user_id=user_id,
  arguments={ 
    "owner": 'example', 
    "repo": 'repo' 
  }
)
```

</CodeGroup>
<Warning>
Never use 'default' as an User ID in production with users. This could expose other users' data
</Warning>

### Organization IDs (Team Accounts)

For applications where teams share connections - one admin connects accounts, all team members use them.

**When to use:**
- Team tools: Slack, Microsoft Teams, Jira
- Shared accounts: support(at)company.com, company GitHub org
- Enterprise apps: IT manages connections for all employees

<CodeGroup>
```typescript TypeScript
// Use the organization ID as userId
const userId = organization.id; // e.g., "org_550e8400"

// All users in the organization share the same connected accounts
const tools = await composio.tools.get(userId, {
  toolkits: ['slack'],
});

// Execute tools in the organization context
const result = await composio.tools.execute('SLACK_SEND_MESSAGE', {
  userId: userId,
  arguments: {
    channel: '#general',
    text: 'Hello from the team!',
  },
});
```
```python Python
# Use the organization ID as userId  
user_id = organization.id # e.g., "org_550e8400"

# All users in the organization share the same connected accounts
tools = composio.tools.get(
  user_id=user_id,
  toolkits=["SLACK"],
)

# Execute tools in the organization context
result = composio.tools.execute(
  "SLACK_SEND_MESSAGE",
  user_id=user_id,
  arguments={ 
    "channel": '#general', 
    "text": 'Hello from the team!' 
  }
)
```
</CodeGroup>

## Multiple Connected Accounts

A single User ID can have multiple connected accounts for the same toolkit. For example, a user might connect both their personal and work Gmail accounts.

**Key concepts:**
- Each connected account gets a unique Connected Account ID
- Multiple accounts can exist under the same User ID for any toolkit
- You can specify which account to use when executing tools

**Account selection:**
- **Explicit:** Specify the Connected Account ID to target a specific account
- **Default:** If no Connected Account ID is provided, the most recently connected account is used 

## Examples
### Organization-Based Application

In B2B applications, typically an admin connects accounts once and all team members share access. Here's a complete implementation:

**Key concepts:**
- Admin performs the OAuth connection using organization ID
- All team members execute tools using the same organization ID
- Permission checks ensure users can only access their organization's connections
```typescript TypeScript
import { Composio } from '@composio/core';
const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
});

// 1. Admin connects Slack for the entire organization
async function connectOrganizationToSlack(organizationId: string, adminUserId: string) {
  // Use organization ID as userId in Composio
  const connectionRequest = await composio.toolkits.authorize(organizationId, 'slack');
  
  // Store the connection request for the admin to complete
  await storeConnectionRequest(organizationId, adminUserId, connectionRequest);
  
  return connectionRequest.redirectUrl;
}

// 2. Any user in the organization can use the connected tools
async function sendSlackMessage(organizationId: string, channel: string, message: string) {
  return await composio.tools.execute('SLACK_SEND_MESSAGE', {
    userId: organizationId, // organization ID, not individual user ID
    arguments: {
      channel: channel,
      text: message,
    },
  });
}

// 3. Check if organization has required connections
async function getOrganizationTools(organizationId: string) {
  return await composio.tools.get(organizationId, {
    toolkits: ['slack', 'github', 'jira'],
  });
}

// Usage in your API endpoint
app.post('/api/slack/message', async (req, res) => {
  const { channel, message } = req.body;
  const organizationId = req.user.organizationId; // Get from your auth system
  
  // Verify user has permission to send messages for this organization
  // The userCanSendMessages function is your responsibility - implement it based on your application's permission model (role-based, feature flags, etc.).
  if (!(await userCanSendMessages(req.user.id, organizationId))) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  
  try {
    const result = await sendSlackMessage(organizationId, channel, message);
    res.json(result.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});
```


### Multi-User Application

In B2C applications, each user connects and manages their own accounts. Every user goes through their own OAuth flow and their data remains completely isolated.

**Key concepts:**
- Each user authorizes their own accounts using their unique user ID
- Connections are isolated - users can only access their own connected accounts
- No permission checks needed since users only access their own data

```typescript TypeScript
import { Composio } from '@composio/core';
const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
});

// 1. User initiates GitHub connection
async function connectUserToGitHub(userId: string) {
  const connectionRequest = await composio.toolkits.authorize(userId, 'github');
  return connectionRequest.redirectUrl;
}

// 2. Get user's connected GitHub tools
async function getUserGitHubTools(userId: string) {
  return await composio.tools.get(userId, {
    toolkits: ['github'],
  });
}

// 3. Execute tool for specific user
async function getUserRepos(userId: string) {
  return await composio.tools.execute('GITHUB_LIST_REPOS', {
    userId: userId,
    arguments: {
      per_page: 10,
    },
  });
}

// Usage in your API endpoint
app.get('/api/github/repos', async (req, res) => {
  const userId = req.user.id; // Get from your auth system
  
  try {
    const repos = await getUserRepos(userId);
    res.json(repos.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch repos' });
  }
});
```

**Data isolation**: Composio ensures each userId's connections and data are completely separate. User A can never access User B's repositories.

### Hybrid Pattern

Many applications need both personal and team resources. Users might connect their personal Gmail while sharing the company Slack workspace.

**Common scenarios:**
- Personal calendars + shared project management
- Individual GitHub accounts + organization repositories  

<CodeGroup>
```typescript TypeScript
// ❌ Wrong: Using individual user ID for org-connected tool
const userTools = await composio.tools.get(req.user.id, {
  toolkits: ['slack'], // Fails - Slack is connected at org level
});

// ✅ Correct: Match the ID type to how the tool was connected
const userPersonalTools = await composio.tools.get(req.user.id, {
  toolkits: ['gmail'], // User's personal Gmail
});

const orgSharedTools = await composio.tools.get(req.user.organizationId, {
  toolkits: ['slack', 'jira'], // Organization's shared tools
});
```
```python Python 
# ❌ Wrong: Using individual user ID for org-connected tool
user_tools = composio.tools.get(
    user_id="user_123",  # Individual user ID
    toolkits=["slack"]  # Fails - Slack is connected at org level
)

# ✅ Correct: Match the ID type to how the tool was connected
user_personal_tools = composio.tools.get(
    user_id="user_123",  # Individual user ID
    toolkits=["gmail"]  # User's personal Gmail
)

org_shared_tools = composio.tools.get(
    user_id="org_123",  # Organization ID
    toolkits=["slack", "jira"]  # Organization's shared tools  
)
```
</CodeGroup>
Remember: The userId must match how the account was connected. If admin connected Slack with org ID, all members must use org ID to access it.

## Best Practices

**Your responsibilities:**
- Pass the correct User ID for each user
- Verify user permissions before executing organization tools  
- Never use 'default' in production with multiple users
- Keep User IDs consistent across your application and Composio
- Use stable identifiers that won't change over time

**Data isolation:** Composio ensures complete isolation between User IDs. Users cannot access another ID's connections or data.

import Anthropic from '@anthropic-ai/sdk';
import { Composio } from '@composio/core';

// Initialize clients
const composio = new Composio();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Create MCP server with Google Sheets tools
const server = await composio.mcp.create(
  "analytics-server",
  {
    toolkits: [
      { toolkit: "googlesheets", authConfigId: "ac_sheets_id" }
    ],
    allowedTools: ["GOOGLESHEETS_GET_DATA", "GOOGLESHEETS_UPDATE_DATA", "GOOGLESHEETS_CREATE_SHEET"]
  }
);

// Generate MCP instance for user
const instance = await server.generate("user@example.com");

// Use MCP with Anthropic for spreadsheet operations
const response = await anthropic.beta.messages.create({
  model: "claude-sonnet-4-5",
  system: "You are a helpful assistant with access to Google Sheets tools. Use these tools to analyze and manage spreadsheet data. Do not ask for confirmation before using the tools.",
  max_tokens: 1000,
  messages: [{
    role: "user",
    content: "Analyze the sales data in my Google Sheets 'Q4 Revenue' spreadsheet, calculate month-over-month growth, and add a new summary sheet with visualizations"
  }],
  mcp_servers: [{
    type: "url",
    url: instance.url,
    name: "composio-mcp-server"
  }],
  betas: ["mcp-client-2025-04-04"]  // Enable MCP beta
});

console.log(response.content);
 use claude as llm for any commands given by the user, to automate reddit posts or twitter posts for their company's marketing.