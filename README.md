Replic 

Replic is an AI-powered social media automation platform for startups that generates, approves, and posts on-brand content across social platforms while preserving human control through chat-based approvals and safety guardrails.

The system is designed to help small teams maintain a consistent social presence without hiring a full marketing team.

Problem

Early-stage founders face recurring challenges with social media:

Time spent manually writing posts and replies

Missed engagement opportunities while building product

Inconsistent brand voice

Risky automation that can damage credibility

Fully autonomous bots feel spammy, while manual posting does not scale.

Solution

Replic combines AI-driven content generation with human-in-the-loop approvals and strict safety controls.

Key principles:

AI assists, humans approve

Short, contextual, on-brand content

Guardrails over growth hacking

Auditability over black-box automation

What Replic Does
Watch & Engage

Monitors X (Twitter) and Reddit for:

Brand mentions

Watched keywords

Specific accounts or threads

Auto-Reply (On-Brand)

Generates short, context-aware replies

Matches a predefined brand persona

Enforces character limits and tone constraints

Daily Posting

Generates 2–3 authentic posts per brand per day

Optional image/meme suggestions

Can run fully automated or approval-gated

Chat-Based Approval

One-tap approve, edit, or reject via:

iMessage (Photon iMessage Kit)

WhatsApp

No dashboard friction

Audit Trail

Every generated or posted item is logged

Includes source, decision, timestamp, and platform

System Architecture

High-level flow:

Ingress (X / Reddit)
→ Queue
→ Filters & Guardrails
→ LLM Content Generator
→ Policy (Auto vs Approval)
→ Post to Platform
→ Activity Log & Dashboard

Core Components
Frontend

Next.js 14

TypeScript

Shadcn UI

Supabase (real-time updates)

Backend Services (Python / FastAPI)

Ingress Workers: Poll X and Reddit APIs

Rate Limiter & Scheduler: Token buckets, backoff strategies

Safety & Relevance Filters:

Keyword and handle matching

Topic exclusion (politics, NSFW)

Duplicate suppression

LLM Orchestrator:

Persona-driven prompts

Short-form (<300 chars) output

Approval Gateway:

iMessage / WhatsApp webhooks

Approve, edit, or reject commands

AI

xAI Grok for content generation

Data & Infra

Supabase Postgres (brands, keywords, approvals, activity)

Redis (queues, rate-limit tokens)

Composio for X integration
