import Anthropic from "@anthropic-ai/sdk";

export interface ExtractedBrandInfo {
  summary: string; // AI-generated comprehensive summary of the brand
  key_insights: string[]; // Top insights about the company
  suggested_questions: string[]; // Follow-up questions for the user to provide more context
  raw_analysis: Record<string, unknown>; // Any other relevant extracted data
}

/**
 * Fetches website content and extracts brand information using Claude Haiku
 */
export async function extractBrandInfoFromWebsite(
  websiteUrl: string
): Promise<ExtractedBrandInfo> {
  const apiKey = process.env.CLAUDE_API_KEY;

  if (!apiKey) {
    throw new Error("CLAUDE_API_KEY environment variable is not set");
  }

  const client = new Anthropic({ apiKey });

  // Validate URL
  if (!websiteUrl.startsWith("http://") && !websiteUrl.startsWith("https://")) {
    throw new Error("Invalid URL: must start with http:// or https://");
  }

  try {
    // Step 1: Fetch the website HTML
    console.log(`[Scraper] Fetching content from: ${websiteUrl}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(websiteUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.statusText}`);
    }

    const html = await response.text();

    // Step 2: Extract plain text from HTML (basic cleanup)
    const plainText = htmlToPlainText(html).substring(0, 8000); // Limit to 8000 chars for API

    console.log(`[Scraper] Extracted ${plainText.length} characters of text`);

    // Step 3: Send to Claude Haiku for comprehensive analysis
    console.log("[Scraper] Sending to Claude Haiku for comprehensive brand analysis...");
    const message = await client.messages.create({
      model: "claude-3-5-haiku-20241022", // Using Claude 3.5 Haiku
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Analyze this website content comprehensively to understand the brand, company, and business. Extract everything meaningful and provide intelligent follow-up questions. Respond ONLY with valid JSON (no markdown, no extra text).

Website Content:
${plainText}

ANALYZE DEEPLY AND EXTRACT:
1. A comprehensive summary of what this company/brand does
2. Key insights about their business model, market position, and strategy
3. Identify what information would be most helpful to ask the user about this business
4. Extract any other relevant structured data you find (company size, industry, tone, etc.)

Return ONLY this JSON structure:
{
  "summary": "2-3 paragraph comprehensive summary of the company, what they do, who they serve, and how they operate",
  "key_insights": [
    "insight 1 about the business",
    "insight 2 about their position",
    "insight 3 about their strategy",
    "insight 4 about their value proposition",
    "insight 5 about their market or approach"
  ],
  "suggested_questions": [
    "What is your primary business objective for content marketing?",
    "Can you elaborate on your target customer segments?",
    "What are your key success metrics?",
    "What tone and style best represents your brand?",
    "Are there specific topics or themes you want to focus on?"
  ],
  "raw_analysis": {
    "company_name": "company name if found",
    "industry": "industry/sector",
    "business_type": "B2B/B2C/B2B2C/etc",
    "products_services": ["product or service"],
    "target_audience": "description of who they serve",
    "tone_of_voice": "professional/casual/technical/creative/etc",
    "key_differentiators": ["what makes them unique"],
    "any_other_relevant_data": "extracted information"
  }
}

IMPORTANT:
- Be comprehensive and insightful
- The summary should give complete context about the business
- Suggested questions should be specific to help understand THEIR unique brand identity
- Extract anything meaningful in raw_analysis
- Return ONLY the JSON object, no other text or markdown`,
        },
      ],
    });

    // Step 4: Parse Claude's response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    console.log("[Scraper] Received response from Claude");

    // Parse JSON response - handle markdown code blocks if Claude adds them
    let jsonText = responseText.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    const brandInfo = JSON.parse(jsonText) as ExtractedBrandInfo;

    console.log("[Scraper] Successfully completed comprehensive brand analysis");

    return brandInfo;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[Scraper] Error: ${error.message}`);
      throw new Error(`Failed to extract brand info: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Simple HTML to plain text converter (Node.js compatible)
 */
function htmlToPlainText(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode basic HTML entities (Node.js compatible)
  const htmlEntities: { [key: string]: string } = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
    "&nbsp;": " ",
    "&#39;": "'",
  };

  for (const [entity, char] of Object.entries(htmlEntities)) {
    text = text.replace(new RegExp(entity, "g"), char);
  }

  // Clean up whitespace
  text = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

/**
 * Test the scraper with a sample website
 */
export async function testScraper(websiteUrl: string) {
  try {
    console.log(`Testing scraper with URL: ${websiteUrl}`);
    const result = await extractBrandInfoFromWebsite(websiteUrl);
    console.log("Extraction successful:", result);
    return result;
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  }
}
