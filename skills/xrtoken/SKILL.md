---
name: xrtoken
description: "Generate images and videos via XRToken API (OpenAI-compatible). Use when creating AI-generated images, videos, or checking available models on xrtoken.ai. Requires XRTOKEN_API_KEY and XRTOKEN_BASE_URL env vars."
version: 1.0.0
author: XRToken
license: MIT
prerequisites:
  env_vars: [XRTOKEN_API_KEY, XRTOKEN_BASE_URL]
  commands: [curl]
metadata:
  hermes:
    tags: [image-generation, video-generation, AI-models, OpenAI-compatible, API]
---

# XRToken — AI Image & Video Generation

Generate images and videos through XRToken's OpenAI-compatible API gateway (50+ models including Seedream, Seedance, Kling, and more). All endpoints use `Authorization: Bearer` auth.

**Docs:** https://xrtoken.ai/docs/en

## When to use

- User asks to generate AI images or videos
- User needs to list available image/video models and their pricing
- User wants to create image variations (img2img)
- User needs to register canonical images as assets for consistent generation

Don't use for text/chat — use the OpenAI-compatible chat endpoint directly.

## Setup

Add to `~/.hermes/.env`:

```bash
XRTOKEN_BASE_URL=https://api.xrtoken.ai          # international
# XRTOKEN_BASE_URL=https://api.xrtoken.net        # China domestic
XRTOKEN_API_KEY=tr-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Get an API key at https://xrtoken.ai/dashboard → API Keys. Keys use `tr-` prefix.

Verify setup:

```bash
curl -s "$XRTOKEN_BASE_URL/v1/models" | head -c 200
```

Should return a JSON model list. No auth required for model listing.

## Image Generation

### Generate images (POST /v1/images/generations)

Synchronous. Returns image URLs directly.

```bash
curl -s "$XRTOKEN_BASE_URL/v1/images/generations" \
  -H "Authorization: Bearer $XRTOKEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "doubao-seedream-5.0-lite", "prompt": "describe your image", "n": 1}'
```

Parameters: `model` (required), `prompt` (required), `n` (default 1), `size` (e.g. `"1024x1024"`).

Response: `{"data": [{"url": "https://..."}]}`. Billed per-image.

### Async image tasks (POST /v1/images/async)

For long-running models like `doubao-seedream-5.0-pro`:

```bash
# Submit
curl -s -X POST "$XRTOKEN_BASE_URL/v1/images/async" \
  -H "Authorization: Bearer $XRTOKEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "doubao-seedream-5.0-pro", "prompt": "..."}'
# Returns: {"id": "task_xxx", "status": "queued"}

# Poll until done
curl -s "$XRTOKEN_BASE_URL/v1/images/async/$TASK_ID" \
  -H "Authorization: Bearer $XRTOKEN_API_KEY"
```

### Image edit / img2img (POST /v1/images/edits)

```bash
curl -s "$XRTOKEN_BASE_URL/v1/images/edits" \
  -H "Authorization: Bearer $XRTOKEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "doubao-seedream-5.0-lite", "prompt": "what to change", "image_url": "https://..."}'
```

Supports `asset://` URIs for registered assets.

## Video Generation

### Create task (POST /v1/videos/generations)

Async. Returns a task ID — poll for results.

```bash
curl -s "$XRTOKEN_BASE_URL/v1/videos/generations" \
  -H "Authorization: Bearer $XRTOKEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "doubao-seedance-2.0",
    "prompt": "video description",
    "duration": 5
  }'
# Returns: {"id": "task_xxx", "status": "queued"}
```

Input modes: text-to-video (`prompt`), image-to-video (`content` array with `first_frame`/`last_frame` roles), or multi-modal (images + videos + audio). Set `"generate_audio": true` for audio-enabled models.

### Query status (GET /v1/videos/generations/{taskId})

```bash
curl -s "$XRTOKEN_BASE_URL/v1/videos/generations/$TASK_ID" \
  -H "Authorization: Bearer $XRTOKEN_API_KEY"
```

Status flow: `queued` → `processing` → `succeeded`/`failed`. On success, response includes `video_url` and `duration`.

### Cancel task (DELETE /v1/videos/generations/{taskId})

```bash
curl -s -X DELETE "$XRTOKEN_BASE_URL/v1/videos/generations/$TASK_ID" \
  -H "Authorization: Bearer $XRTOKEN_API_KEY"
```

## Model Listing

```bash
curl -s "$XRTOKEN_BASE_URL/v1/models"
```

No auth needed. Returns all models with `type` (image/video/text/audio), `price_per_unit` (CNY), and `available` status. Filter in jq:

```bash
# Image models only
curl -s "$XRTOKEN_BASE_URL/v1/models" | jq '[.data[] | select(.type=="image")]'

# Video models only
curl -s "$XRTOKEN_BASE_URL/v1/models" | jq '[.data[] | select(.type=="video")]'
```

Models are added frequently — always query live instead of hardcoding model names.

## Asset Library

Register canonical reference images for consistent generation:

```bash
# Create asset
curl -s -X POST "$XRTOKEN_BASE_URL/v1/assets" \
  -H "Authorization: Bearer $XRTOKEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "reference-01", "url": "https://...", "group_id": "..."}'

# List assets
curl -s "$XRTOKEN_BASE_URL/v1/assets?group_id=..." \
  -H "Authorization: Bearer $XRTOKEN_API_KEY"
```

Reference assets in generation via `"image_url": "asset://..."`.

## Using in Hermes

Prefer `terminal` with curl commands for simple cases. For multi-step workflows, use `execute_code`:

```python
import os, json, urllib.request

def generate_image(model, prompt, n=1):
    url = f"{os.environ['XRTOKEN_BASE_URL']}/v1/images/generations"
    body = json.dumps({"model": model, "prompt": prompt, "n": n}).encode()
    req = urllib.request.Request(url, data=body, headers={
        "Authorization": f"Bearer {os.environ['XRTOKEN_API_KEY']}",
        "Content-Type": "application/json"
    })
    return [d["url"] for d in json.loads(urllib.request.urlopen(req).read())["data"]]
```

## Billing

- **Images**: charged per-image × unit price (CNY) on success
- **Videos**: estimated cost frozen at submission, settled by actual usage on success; refunded on failure
- Check pricing with `GET /v1/models` — `price_per_unit` in CNY (万分之一分)

## Common Pitfalls

1. **Hardcoding model names.** Models change. Always run `GET /v1/models` to list current available models before generating.
2. **Forgetting the `/v1` prefix.** All endpoints are under `/v1/`. The base URL is `https://api.xrtoken.ai`, full path is `/v1/images/generations`.
3. **Using sync endpoint for Pro models.** `doubao-seedream-5.0-pro` requires the async `/v1/images/async` endpoint — synchronous `/v1/images/generations` will fail or timeout.
4. **Missing `XRTOKEN_BASE_URL`.** The skill requires both `XRTOKEN_API_KEY` and `XRTOKEN_BASE_URL`. Without `XRTOKEN_BASE_URL`, curl commands will fail.
5. **Assuming video completes instantly.** Video generation is async. Always poll with `GET /v1/videos/generations/{taskId}` and check `status` before expecting a `video_url`.
6. **402 errors.** Mean insufficient balance — user needs to top up at https://xrtoken.ai/dashboard.

## Verification Checklist

- [ ] `XRTOKEN_API_KEY` and `XRTOKEN_BASE_URL` set in `~/.hermes/.env`
- [ ] `curl -s "$XRTOKEN_BASE_URL/v1/models"` returns models
- [ ] Image generation returns URLs in `data[].url`
- [ ] Video generation returns a task ID and can be polled to completion
