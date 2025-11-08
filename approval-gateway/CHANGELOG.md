# Changelog

All notable changes to the BrandPilot Approval Gateway will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-11-08

### Added

#### Core Features
- FastAPI application with health check endpoint
- POST `/candidate` endpoint for receiving approval requests
- GET `/activity` endpoint for retrieving brand activity logs
- POST `/webhooks/whatsapp` for Twilio webhook integration
- POST `/webhooks/imessage` for Photon iMessage Kit integration

#### Rate Limiting
- Redis-backed token bucket rate limiter
- Configurable capacity and refill rates per brand
- Minimum spacing enforcement between prompts
- Separate buckets for WhatsApp and iMessage channels

#### State Management
- Redis store for candidate state tracking
- Idempotency protection (prevents duplicate prompts)
- Activity logging for audit trails
- Support for state transitions: new → prompted → approved/edited/rejected/expired

#### Timeout Handling
- Background worker for checking expired candidates
- Configurable deadline per candidate (default 900s)
- Automatic expiry notifications to core service

#### WhatsApp Integration
- Twilio client for sending approval prompts
- Command parsing: approve, edit, skip
- Webhook signature validation
- 200-character limit enforcement on edits

#### iMessage Integration
- Photon iMessage Kit client integration
- Command parsing with regex patterns
- Support for multiline edit messages
- Async HTTP communication with sidecar

#### Testing
- Unit tests for WhatsApp command parsing
- Unit tests for iMessage command parsing
- Unit tests for rate limiting logic
- Unit tests for Pydantic models
- pytest configuration with async support

#### Tools & Scripts
- Seed script for creating demo candidates
- Mock core service for testing decision callbacks
- Docker Compose configuration for local development
- Makefile with common commands

#### Documentation
- Comprehensive README with quick start guide
- EXAMPLES.md with API usage examples
- DEPLOYMENT.md with platform-specific guides
- Environment variable configuration (env.example)

#### DevOps
- Dockerfile for containerization
- Docker Compose for multi-service orchestration
- .gitignore for Python projects
- pyproject.toml for tool configuration

### Configuration

- Pydantic Settings for environment variable management
- Support for multiple Redis backends
- Configurable rate limits and timeouts
- Webhook signing secret for security

### Security

- Authorization header validation for `/candidate` endpoint
- Twilio webhook signature verification
- Redis-based idempotency protection
- Input validation via Pydantic models

## [Unreleased]

### Planned Features

- Slack approval integration
- Web dashboard for activity monitoring
- Webhook retry mechanism with exponential backoff
- Multi-brand owner support (different phone numbers per brand)
- Analytics and metrics (Prometheus)
- A/B testing for reply styles
- Scheduled approval reminders
- Batch approval interface

### Potential Improvements

- GraphQL API support
- WebSocket for real-time updates
- Email approval fallback
- SMS approval (non-WhatsApp)
- Custom approval workflows
- Role-based access control
- Advanced analytics dashboard

---

[0.1.0]: https://github.com/yourorg/approval-gateway/releases/tag/v0.1.0

