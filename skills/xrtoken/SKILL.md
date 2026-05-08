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

#### Request parameters

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `model` | string | ✓ | — | Video model ID, e.g. `volcengine/doubao-seedance-2-0-260128` |
| `content` | array | ✓ | — | Multimodal input array (see schema below) |
| `resolution` | string | ✗ | `720p` | `480p` / `720p` / `1080p` |
| `ratio` | string | ✗ | `adaptive` | `16:9` / `4:3` / `1:1` / `3:4` / `9:16` / `21:9` / `adaptive` |
| `duration` | integer | ✗ | `5` | Output length in seconds (range varies by model) |
| `seed` | integer | ✗ | `-1` | `-1` to `2^32-1`; `-1` = random |
| `generate_audio` | boolean | ✗ | `true` | Generate matching audio (audio-capable models only) |
| `return_last_frame` | boolean | ✗ | `false` | Include `last_frame_url` in result |
| `camera_fixed` | boolean | ✗ | `false` | Lock camera position |
| `watermark` | boolean | ✗ | `false` | Add provider watermark |
| `service_tier` | string | ✗ | `default` | `default` or `flex` |
| `callback_url` | string | ✗ | — | URL invoked when task finishes |
| `safety_identifier` | string | ✗ | — | End-user ID for safety auditing (≤64 chars) |

#### Content array schema

Each element is an object with a `type` discriminator (OpenAI-style multimodal):

| `type` | Fields | Notes |
|--------|--------|-------|
| `text` | `text: string` | The prompt |
| `image_url` | `image_url: { url: string }`, optional `role: "first_frame"\|"last_frame"\|"reference_image"` | Use `asset://` URIs to reference registered assets |
| `video_url` | `video_url: { url: string }` | Reference video (Seedance multi-modal) |
| `audio_url` | `audio_url: { url: string }` | Reference audio (Seedance multi-modal) |

Seedance 2.0 multi-modal accepts 1–9 reference images, 1–3 reference videos, 1–3 reference audios in one request.

#### Examples

Text-to-video:

```bash
curl -s "$XRTOKEN_BASE_URL/v1/videos/generations" \
  -H "Authorization: Bearer $XRTOKEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "volcengine/doubao-seedance-2-0-260128",
    "content": [{"type": "text", "text": "a corgi running on the beach at sunset"}],
    "resolution": "1080p",
    "ratio": "16:9",
    "duration": 5,
    "generate_audio": true
  }'
```

Image-to-video (first frame → animate):

```bash
curl -s "$XRTOKEN_BASE_URL/v1/videos/generations" \
  -H "Authorization: Bearer $XRTOKEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "volcengine/doubao-seedance-2-0-260128",
    "content": [
      {"type": "text", "text": "the character waves and smiles"},
      {"type": "image_url", "image_url": {"url": "https://..."}, "role": "first_frame"}
    ],
    "duration": 5
  }'
```

First + last frame interpolation:

```json
{
  "model": "volcengine/doubao-seedance-2-0-260128",
  "content": [
    {"type": "text", "text": "smooth transition between frames"},
    {"type": "image_url", "image_url": {"url": "asset://ref-start"}, "role": "first_frame"},
    {"type": "image_url", "image_url": {"url": "asset://ref-end"},   "role": "last_frame"}
  ]
}
```

Response (200):

```json
{
  "id": "task_xxx",
  "upstream_id": "...",
  "model": "volcengine/doubao-seedance-2-0-260128",
  "status": "queued",
  "created_at": "2026-05-08T06:30:00Z"
}
```

### Query status (GET /v1/videos/generations/{taskId})

```bash
curl -s "$XRTOKEN_BASE_URL/v1/videos/generations/$TASK_ID" \
  -H "Authorization: Bearer $XRTOKEN_API_KEY"
```

Status flow: `queued` → `processing` → `succeeded` / `failed` / `cancelled` / `expired`.

Response fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Task ID |
| `model` | string | Model used |
| `status` | string | `queued` / `processing` / `succeeded` / `failed` / `expired` / `cancelled` |
| `video_url` | string | Result URL (when `succeeded`) |
| `last_frame_url` | string | Last-frame URL (if `return_last_frame: true`) |
| `duration` | integer | Actual duration in seconds |
| `frames` | integer | Total frames generated |
| `resolution` | string | Actual output resolution |
| `ratio` | string | Actual output aspect ratio |
| `seed` | integer | Seed used |
| `generate_audio` | boolean | Whether audio was generated |
| `service_tier` | string | Tier used |
| `draft` | boolean | Whether result is a draft |
| `usage` | object | `{completion_tokens, total_tokens}` — for billing |
| `error` | object | `{code, message}` — present when `status: "failed"` |
| `created_at` / `updated_at` | string | ISO 8601 timestamps |

### Cancel task (DELETE /v1/videos/generations/{taskId})

```bash
curl -s -X DELETE "$XRTOKEN_BASE_URL/v1/videos/generations/$TASK_ID" \
  -H "Authorization: Bearer $XRTOKEN_API_KEY"
```

Only effective while `status` is `queued` or `processing`.

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
