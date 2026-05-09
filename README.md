# XRToken Skills

Cross-agent skills for [XRToken](https://xrtoken.ai) — the AI API gateway with 50+ models. Distributed as a Claude Code plugin marketplace; also installable on Hermes, OpenClaw, Codex CLI, Gemini CLI, and GitHub Copilot CLI.

## Available Skills

| Skill | Description |
|-------|-------------|
| [xrtoken](skills/xrtoken/SKILL.md) | Generate images and videos via XRToken API (OpenAI-compatible) |
| [seedance-prompt](skills/seedance-prompt/SKILL.md) | Seedance 2.0 video prompt rewriting protocol — structure template, motion-deceleration rules, face-stability constraints |

## Setup (all agents)

Configure your API credentials. XRToken reads these two vars at runtime:

```bash
export XRTOKEN_BASE_URL=https://api.xrtoken.ai
export XRTOKEN_API_KEY=tr-your-key-here
```

Get an API key at https://xrtoken.ai/dashboard → API Keys. For Hermes, put them in `~/.hermes/.env`. For Claude Code, add them to the `env` block in `~/.claude/settings.json`.

## Install

### Claude Code (plugin marketplace — recommended)

```
/plugin marketplace add xrtoken/hermes-skills
/plugin install xrtoken@xrtoken-skills
/reload-plugins
```

After install, the skills auto-trigger on keywords like "生图"/"生视频", or invoke them directly:

```
/xrtoken:xrtoken
/xrtoken:seedance-prompt
```

Update later via `/plugin marketplace update xrtoken-skills`. Uninstall via `/plugin uninstall xrtoken@xrtoken-skills`.

### Hermes

```bash
hermes skills tap add https://github.com/xrtoken/hermes-skills
hermes skills install xrtoken/hermes-skills/skills/xrtoken --force
hermes skills install xrtoken/hermes-skills/skills/seedance-prompt --force
```

`--force` is required: API-wrapper skills trigger a security scan.

### OpenClaw

If published to ClawHub:

```bash
openclaw skills install xrtoken
openclaw skills install seedance-prompt
```

Otherwise drop the skill folders into the personal skills dir (the standard manual install path):

```bash
git clone https://github.com/xrtoken/hermes-skills /tmp/xrtoken-skills
mkdir -p ~/.openclaw/skills
cp -r /tmp/xrtoken-skills/skills/{xrtoken,seedance-prompt} ~/.openclaw/skills/
openclaw skills list
```

### Codex CLI

Codex skills load from `~/.codex/skills/<name>/SKILL.md`:

```bash
git clone https://github.com/xrtoken/hermes-skills /tmp/xrtoken-skills
mkdir -p ~/.codex/skills
cp -r /tmp/xrtoken-skills/skills/{xrtoken,seedance-prompt} ~/.codex/skills/
```

Restart Codex so it reloads metadata. Verify with `~/.codex/skills/xrtoken/SKILL.md`, not `~/.codex/skills/xrtoken/xrtoken/SKILL.md`.

### Gemini CLI

Skills load from `~/.gemini/antigravity/skills/<name>/SKILL.md`:

```bash
git clone https://github.com/xrtoken/hermes-skills /tmp/xrtoken-skills
mkdir -p ~/.gemini/antigravity/skills
cp -r /tmp/xrtoken-skills/skills/{xrtoken,seedance-prompt} ~/.gemini/antigravity/skills/
```

### GitHub Copilot CLI

Copilot CLI also reads `.claude-plugin/marketplace.json`, so the same plugin marketplace command works:

```
/plugin marketplace add xrtoken/hermes-skills
/plugin install xrtoken@xrtoken-skills
```

For manual install, drop folders into `~/.copilot/skills/` (personal) or `<repo>/.github/skills/` (project):

```bash
git clone https://github.com/xrtoken/hermes-skills /tmp/xrtoken-skills
mkdir -p ~/.copilot/skills
cp -r /tmp/xrtoken-skills/skills/{xrtoken,seedance-prompt} ~/.copilot/skills/
```

## Updates

- **Claude Code / Copilot CLI**: `/plugin marketplace update xrtoken-skills` — handles updates via the marketplace.
- **Hermes**: `hermes skills update xrtoken seedance-prompt`.
- **Manual installs (OpenClaw / Codex / Gemini)**: `cd /tmp/xrtoken-skills && git pull`, then re-run `cp -r`. Tip: replace `cp -r` with `ln -s "$(pwd)/skills/<name>" ~/.<agent>/skills/<name>` to track upstream automatically.

## Compatibility Note

SKILL.md uses minimal frontmatter (`name`, `description`) plus optional metadata under `metadata.hermes:` — agents that don't recognize the namespace ignore it. The repo also ships `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json` for the Claude Code / Copilot CLI plugin system.
