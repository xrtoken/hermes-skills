---
name: xrtoken
description: "XRToken AI 图像/视频生成 Skill。支持文生图/图生图、文生视频/图生视频/参考视频音频/首尾帧。当用户说\"生图\"、\"画图\"、\"生视频\"、\"生成视频\"、\"做个视频\"、\"seedance\"、\"seedream\"、\"xrtoken\" 时激活。OpenAI 兼容网关，50+ 模型。"
version: 2.3.0
author: XRToken
license: MIT
prerequisites:
  env_vars: [XRTOKEN_API_KEY, XRTOKEN_BASE_URL]
  commands: [node]
metadata:
  hermes:
    tags: [image-generation, video-generation, AI-models, OpenAI-compatible, seedance, seedream]
---

# XRToken — AI 图像 & 视频生成

通过 XRToken OpenAI 兼容网关调用 50+ 模型（Seedream、Seedance、Kling 等）。本 skill 提供 wrapper 脚本 `scripts/xrtoken.js`，零依赖（只用 Node 内置模块），支持自然语言参数提取、智能模型路由、本地文件自动 base64、异步任务持久化、结果自动下载。

**Docs:** https://xrtoken.ai/docs/en

## 触发关键词

用户说以下词时激活：
- 图：生图、画图、生成图片、做张图、seedream
- 视频：生视频、生成视频、视频生成、做个视频、seedance
- 模型：xrtoken、列模型、有哪些模型

## 核心命令

```bash
# 视频
node scripts/xrtoken.js video create        --prompt "..."     # 提交任务
node scripts/xrtoken.js video check-pending                    # 轮询所有 pending，自动下载
node scripts/xrtoken.js video get           --task-id cgt-xxx
node scripts/xrtoken.js video list          --filter-status processing
node scripts/xrtoken.js video delete        --task-id cgt-xxx

# 图片
node scripts/xrtoken.js image create        --prompt "..."     # 同步生成
node scripts/xrtoken.js image edit          --prompt "..." --image-file path.png
node scripts/xrtoken.js image async-create  --prompt "..."     # Pro 模型异步
node scripts/xrtoken.js image check-pending

# 模型 / 资产
node scripts/xrtoken.js models list --type video
node scripts/xrtoken.js asset  list --group-id xxx
node scripts/xrtoken.js asset  create --name ref-01 --image-file path.jpg
```

任何子命令加 `--help` 看完整选项。

## 视频生成参数

| CLI flag | 类型 | 默认 | 说明 |
|----------|------|------|------|
| `--prompt` | string | — | **必填**。视频描述 |
| `--duration` | int | 5 | 时长（秒）。范围因模型而异 |
| `--ratio` | string | adaptive | `16:9`/`9:16`/`1:1`/`4:3`/`3:4`/`21:9`/`adaptive` |
| `--resolution` | string | 720p | `480p`/`720p`/`1080p` |
| `--generate-audio` / `--no-generate-audio` | bool | true | 是否生成音频 |
| `--camera-fixed` | bool | false | 固定镜头视角 |
| `--watermark` | bool | false | 添加水印 |
| `--return-last-frame` | bool | false | 返回尾帧（用于长视频拼接） |
| `--service-tier` | string | default | `default`/`flex`（flex 离线成本约 -50%） |
| `--seed` | int | -1 | 随机种子，复现用 |
| `--draft` | bool | false | 样片预览模式（仅 1.5-pro 支持） |
| `--model` | string | 自动 | 模型 ID 或别名（`2.0`/`2.0-fast`/`1.5-pro`） |
| `--image-file` (可重复) | path | — | 本地图片，自动 base64 |
| `--image-url` (可重复) | url | — | 在线图片（http/https/asset:// 都行） |
| `--video-file` / `--video-url` (可重复) | path/url | — | 参考视频 |
| `--audio-file` / `--audio-url` (可重复) | path/url | — | 参考音频 |
| `--callback-url` | url | — | 任务完成回调 |
| `--safety-identifier` | string | — | 终端用户标识（≤64 字符） |
| `--wait` | bool | false | 阻塞等待完成并自动下载 |
| `--strict-prompt` | bool | false | 用 seedance-prompt 规则校验 prompt（违规词、长度、镜头、画质锚词、人脸约束）；硬违规直接拒绝提交 |
| `--poll-seconds` | int | 10 | `--wait` 时轮询间隔 |
| `--timeout-seconds` | int | 1800 | `--wait` 时总超时 |
| `--api-key` | string | — | 覆盖凭据查找 |
| `--base-url` | url | — | 覆盖 base URL（如切国内） |
| `--dry-run` | bool | false | 打印请求体，不调 API |
| `--json` | bool | false | 原始 JSON 输出 |

## 图片生成参数

| CLI flag | 默认 | 说明 |
|----------|------|------|
| `--prompt` | — | **必填** |
| `--model` | lite | `lite`（同步）/ `pro`（自动转 async） |
| `--n` | 1 | 生成数量 |
| `--size` | — | `1024x1024` 等 |
| `--seed` | — | 随机种子 |
| `--response-format` | url | `url` 或 `b64_json` |
| `--image-file` / `--image-url` | — | `image edit` 子命令必填 |
| `--mask-url` | — | `image edit` 蒙版 |
| `--no-download` | — | 关闭自动下载 |
| `--force-sync` | — | 强制同步端点（即使 pro 模型） |

## 配套：Seedance Prompt 写作规范

视频默认走 Seedance 模型，prompt 质量决定效果。**强烈推荐同时安装 `seedance-prompt` skill**，它提供结构模板、动作减速规则、人脸约束词和场景化模板。Agent 调 `video create` 前应先按那套规范改写用户的口语 prompt。

```bash
hermes skills install xrtoken/hermes-skills/skills/seedance-prompt --force
```

## 自然语言参数提取

Wrapper 自动从 `--prompt` 中提取（**CLI flag 始终优先**）：

| 用户说 | 自动设 |
|--------|--------|
| "5秒"、"10秒"、"15s" | `--duration` |
| "竖屏"、"手机" | `--ratio 9:16` |
| "横屏"、"电脑"、"宽屏" | `--ratio 16:9` |
| "方形"、"正方形" | `--ratio 1:1` |
| "1080p"、"超清"、"2k" | `--resolution 1080p` |
| "720p"、"高清" | `--resolution 720p` |
| "480p"、"标清" | `--resolution 480p` |
| "不要声音"、"静音" | `--no-generate-audio` |
| "固定镜头" | `--camera-fixed` |
| "样片"、"预览"、"草稿" | `--draft`（路由到 1.5-pro） |
| "低成本"、"离线" | `--service-tier flex` |
| "快速"、"快点"、"加急" | 模型路由到 2.0-fast |
| "高质量"、"专业版" | 模型路由到 2.0 标准 |
| "联网搜索"、"实时" | `--enable-web-search` |
| "seed=12345" | `--seed 12345` |

## 智能模型路由

| 用户意图 | 自动选 | 原因 |
|----------|--------|------|
| 1080p / 高清 | Seedance 2.0 | fast 不支持 1080p |
| 快速 / fast | Seedance 2.0-fast | 速度优先 |
| 样片 / 预览 / draft | Seedance 1.5-pro | 仅它支持样片 |
| flex / 离线 / 低成本 | Seedance 1.5-pro | 仅它支持离线 |
| 传图/视频/音频参考 | Seedance 2.0 / 2.0-fast | 1.5-pro 不支持多模态 |
| 默认 | Seedance 2.0 | 功能最全 |
| 图片：默认 | Seedream lite（同步） | 速度快 |
| 图片：高质量/专业 | Seedream pro（自动 async） | 细节更好 |

模型 ID 可通过环境变量覆盖：`XRTOKEN_VIDEO_STANDARD` / `XRTOKEN_VIDEO_FAST` / `XRTOKEN_VIDEO_PRO` / `XRTOKEN_IMAGE_LITE` / `XRTOKEN_IMAGE_PRO`。

## 多模态自动模式

根据传入文件数自动选模式（**Agent 不需要预处理 base64**，直接传路径）：

| 输入 | 自动模式 | 示例 |
|------|---------|------|
| 纯文本 | 文生视频 | `--prompt "..."` |
| 1 图 + 文 | 首帧生视频 | `--image-file a.jpg` |
| 2 图 + 文 | 首尾帧 | `--image-file start.jpg --image-file end.jpg` |
| ≥3 图 + 文 | 参考图 | 多个 `--image-file` |
| 视频 + 文 | 参考视频 | `--video-file ref.mp4` |
| 音频 + 文 | 参考音频 | `--audio-file ref.mp3` |
| 混合 | Seedance 2.0 多模态 | 任意组合（1-9 图 + 1-3 视频 + 1-3 音频） |

## 典型场景

### 1. 简单文生视频

```bash
node scripts/xrtoken.js video create \
  --prompt "小猫在草地奔跑，阳光明媚，5秒，720p"
```
NL 提取 → `duration=5, resolution=720p`。

### 2. 首帧生视频

```bash
node scripts/xrtoken.js video create \
  --prompt "日落海边，海鸥飞过，温暖治愈，8秒" \
  --image-file /path/to/start.jpg
```

### 3. 首尾帧过渡

```bash
node scripts/xrtoken.js video create \
  --prompt "日出到日落的时间流逝，10秒" \
  --image-file /path/start.jpg \
  --image-file /path/end.jpg
```

### 4. 低成本离线

```bash
node scripts/xrtoken.js video create \
  --prompt "城市夜景延时，低成本模式，10秒"
# → 自动选 1.5-pro + service_tier=flex
```

### 5. 同步图片

```bash
node scripts/xrtoken.js image create --prompt "极简风格的山脉插画"
# 默认 lite 模型，自动下载到 ~/Desktop/XRToken-Outputs/<task-id>/
```

### 6. 图片编辑

```bash
node scripts/xrtoken.js image edit \
  --prompt "把背景换成星空" \
  --image-file /path/to/photo.jpg
```

## 异步任务管理

提交任务后会写入 `~/.xrtoken/pending-tasks.json`（fallback `./.xrtoken/...`）：

```bash
# 用户问"好了吗"时
node scripts/xrtoken.js video check-pending
# → 轮询所有 pending，对 succeeded 自动下载到本地，移出列表
```

完成的视频/图片自动保存到（三级 fallback）：

| 优先级 | 路径 |
|--------|------|
| 1 | `$XRTOKEN_OUTPUT_DIR`（如设置） |
| 2 | `~/Desktop/XRToken-Outputs/<task-id>/` |
| 3 | `~/XRToken-Outputs/<task-id>/` |
| 4 | `./XRToken-Outputs/<task-id>/` |

## API Key 与 Base URL 查找

按优先级（首个命中即用）：

1. **CLI**：`--api-key` / `--base-url`
2. **Claude Code**：`~/.claude/settings.json` 中 `env.XRTOKEN_API_KEY` / `env.XRTOKEN_BASE_URL`
3. **OpenClaw**：`~/.openclaw/openclaw.json` 中 `models.providers.<name>` （匹配 name 含 `xrtoken` 或 baseURL 含 `xrtoken.ai|xrtoken.net`）
4. **Hermes**：`~/.hermes/.env` 中 `XRTOKEN_API_KEY=...` / `XRTOKEN_BASE_URL=...`
5. **环境变量**：`XRTOKEN_API_KEY` / `XRTOKEN_BASE_URL`

API key 以 `tr-` 开头，从 https://xrtoken.ai/dashboard 获取。

国内域名：`XRTOKEN_BASE_URL=https://api.xrtoken.net`。

## 桌面通知（macOS）

完成时弹通知：加 `--notify` 或设 `XRTOKEN_NOTIFY=1`。Linux/Windows 上自动 no-op，不会报错。

```bash
node scripts/xrtoken.js video check-pending --notify
```

## 框架适配建议

### 配合 OpenClaw / 支持 Cron 的框架（推荐）

配置 Cron 每 2 分钟执行一次 `check-pending`，任务完成后自动通知用户。`examples/` 目录下有现成模板：

| 框架 | 模板 |
|------|------|
| OpenClaw | `examples/openclaw-cron.json` |
| Hermes | `examples/hermes-cron.yaml` |
| macOS launchd | `examples/launchd.plist` |
| Linux cron | `examples/crontab` |

```yaml
schedule: every 2 minutes
command: node scripts/xrtoken.js video check-pending --notify
```

### 配合 Claude Code / 纯交互式（无 Cron）

策略 A（被动，默认）：提交后告诉用户"约需 3 分钟，问我进度即可"，用户问时再 `check-pending`。

策略 B（阻塞等待）：用户明确要求等待时，加 `--wait`，wrapper 内部轮询并下载完才返回。注意会阻塞当前对话回合。

## Agent 执行规范（大模型必读）

**你不需要：**
- 自己读取本地文件并 base64 编码
- 自己上传到图床
- 自己计算 ratio/resolution/duration
- 手动 hardcode 模型 ID

**你只需要：**
- 把用户的本地文件**绝对路径**直接传给 `--image-file` / `--video-file` / `--audio-file`
- 把用户给的 http/https URL 直接传给 `--image-url` 等
- 把用户的自然语言 prompt 原封不动传给 `--prompt`，wrapper 会从中提取参数
- 用户没明确说模型时**不要传 `--model`**，让 wrapper 路由

**输出处理：**
- 提交后输出格式：`id: cgt-xxx` / `status: queued` —— 转述给用户即可
- 完成后输出含 `saved: <绝对路径>` —— 把这个路径传给框架的「展示文件」工具给用户
- 加 `--json` 拿 JSON 时，从 `_localPath` / `_localPaths` 读

## 完整 CLI 文档

`docs/CLI.md` 是从每个子命令的 `--help` 自动汇总生成的，可直接查阅。重新生成：

```bash
node scripts/generate-docs.js
```

## 安装与升级

```bash
# 首次安装
hermes skills tap add https://github.com/xrtoken/hermes-skills
hermes skills install xrtoken/hermes-skills/skills/xrtoken --force

# 升级
hermes skills update xrtoken
```

## 常见坑

1. **模型名 hardcode**：模型一直在加。用 alias（`2.0`/`pro`/`lite`）或让 wrapper 自动选。
2. **忘 `/v1` 前缀**：所有端点在 `/v1/` 下，wrapper 已封装。
3. **Pro 图片用同步端点**：Pro 模型必须 async，wrapper 会自动转。要强制同步用 `--force-sync`（一般会失败）。
4. **轮询频率太高**：默认 10s 已经合理，不要设小于 5s。
5. **402 错误**：余额不足，去 https://xrtoken.ai/dashboard 充值。
6. **Cron 没触发**：是 Agent 框架的应用层 Cron，不是系统 crontab。

## 验证清单

- [ ] `XRTOKEN_API_KEY` 在 `~/.hermes/.env` / 平台配置 / env 之一
- [ ] `node scripts/xrtoken.js models list` 返回模型列表
- [ ] `node scripts/xrtoken.js video create --prompt "test" --dry-run` 输出预期 body
- [ ] `node scripts/xrtoken.js image create --prompt "测试"` 实际生成并下载
- [ ] `node scripts/xrtoken.js video create --prompt "测试视频"` 提交后 `video check-pending` 能轮到
