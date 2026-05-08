# XRToken Skill — CLI Reference

Auto-generated from each command's `--help`. Run `node scripts/generate-docs.js` to refresh.

## Top-level usage

```
xrtoken — XRToken AI image & video generation wrapper

Usage:
  xrtoken <namespace> <command> [options]

Namespaces:
  video           Video generation (Seedance)
    create        Submit video task (async)
    get           Query single task
    list          List recent tasks
    delete        Cancel/delete task
    check-pending Poll all pending and download completed

  image           Image generation (Seedream / etc.)
    create        Sync image generation
    edit          Image edit / img2img
    async-create  Async image task (Pro models)
    check-pending Poll all pending image tasks

  models          Model registry
    list          List available models (--type image|video|text|audio)

  asset           Asset library
    list          List assets in a group
    create        Register a canonical asset

Common options:
  --api-key <key>           Override API key (else: settings → ~/.openclaw → ~/.hermes/.env → env)
  --base-url <url>          Override XRTOKEN_BASE_URL
  --json                    Print raw JSON response
  --help, -h                Show this help

Run `xrtoken <namespace> <command> --help` for command-specific options.
```

## video

### `xrtoken video create`

```
xrtoken video create — submit an async video task

Required:
  --prompt <text>              Describe the video

Common:
  --duration <sec>             Default 5
  --ratio <16:9|9:16|...>      Default adaptive
  --resolution <480p|720p|1080p>  Default 720p
  --generate-audio / --no-generate-audio
  --camera-fixed
  --watermark
  --return-last-frame
  --service-tier <default|flex>
  --seed <int>
  --model <id|alias>           Aliases: 2.0 / 2.0-fast / 1.5-pro
  --draft                      Preview mode (1.5-pro only)

Multimodal (each may be repeated):
  --image-file <path>          1=first_frame, 2=first+last, ≥3=reference
  --image-url <url>
  --video-file <path>          --video-url <url>
  --audio-file <path>          --audio-url <url>

Misc:
  --callback-url <url>
  --safety-identifier <id>
  --wait                       Block until done; auto-download result
  --poll-seconds <n>           Polling interval when --wait (default 10)
  --timeout-seconds <n>        Total wait cap when --wait (default 1800)
  --dry-run                    Print request body, don't call API
  --json                       Raw JSON output
```

### `xrtoken video get`

```
xrtoken video get — query single task
  --task-id <id>     Task to query (required)
  --json             Raw JSON
```

### `xrtoken video list`

```
xrtoken video list — list recent video tasks
  --filter-status <s>   queued | processing | succeeded | failed | cancelled | expired
  --limit <n>
  --user-id <id>
  --json
```

### `xrtoken video delete`

```
xrtoken video delete — cancel a queued/processing task
  --task-id <id>     Required
  --json
```

### `xrtoken video check-pending`

```
xrtoken video check-pending — poll all pending video tasks; auto-download succeeded
  --json
```

## image

### `xrtoken image create`

```
xrtoken image create — synchronous image generation

Required:
  --prompt <text>

Optional:
  --model <id|alias>      Aliases: lite (default) / pro (auto-async)
  --n <int>               Default 1
  --size <WxH>            e.g. 1024x1024
  --seed <int>
  --response-format <url|b64_json>
  --no-download           Skip auto-download
  --force-sync            Force sync endpoint even for pro models
  --dry-run               Print body, don't call API
  --json                  Raw JSON
```

### `xrtoken image edit`

```
xrtoken image edit — img2img / image edit

Required:
  --prompt <text>
  --image-file <path>     OR  --image-url <url>

Optional:
  --mask-url <url|path>
  --model <id|alias>
  --n <int>
  --size <WxH>
  --seed <int>
  --no-download
  --dry-run
  --json
```

### `xrtoken image async-create`

```
xrtoken image async-create — submit async image task (pro models)

Required:
  --prompt <text>

Optional:
  --model <id|alias>    Default: pro
  --n <int>             Default 1
  --size <WxH>
  --seed <int>
  --dry-run
  --json
```

### `xrtoken image check-pending`

```
xrtoken image check-pending — poll all pending image tasks; auto-download succeeded
  --json
```

## models

### `xrtoken models list`

```
xrtoken models list — list available models
  --type <image|video|text|audio>
  --available             Only available
  --json
```

## asset

### `xrtoken asset list`

```
xrtoken asset list — list registered assets
  --group-id <id>
  --limit <n>
  --json
```

### `xrtoken asset create`

```
xrtoken asset create — register a canonical reference asset
  --name <str>          Required
  --url <url>           OR  --image-file <path>
  --group-id <id>
  --dry-run
  --json
```
