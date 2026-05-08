# XRToken Hermes Skills

Hermes Agent skills for [XRToken](https://xrtoken.ai) — the AI API gateway with 50+ models.

## Available Skills

| Skill | Description |
|-------|-------------|
| [xrtoken](skills/xrtoken/SKILL.md) | Generate images and videos via XRToken API (OpenAI-compatible) |

## Install

```bash
# Add this repo as a skill source
hermes skills tap add https://github.com/xrtoken/hermes-skills

# Install a skill
hermes skills install xrtoken
```

## Setup

After installing, configure your API credentials in `~/.hermes/.env`:

```bash
XRTOKEN_BASE_URL=https://api.xrtoken.ai
XRTOKEN_API_KEY=tr-your-key-here
```

Get an API key at https://xrtoken.ai/dashboard → API Keys.
