# Paseo Orchestration & Issues Board

> **Note**: This Forgejo repository is dedicated to **orchestration, task tracking, and agent lifecycle management**. Codebases and releases live on GitHub:
> - `paseo-plugin-helper`: [github.com/xpufx/paseo-plugin-helper](https://github.com/xpufx/paseo-plugin-helper)
> - `paseo-top`: [github.com/xpufx/paseo-top](https://github.com/xpufx/paseo-top)
> - `paseo-x-comms`: [github.com/xpufx/paseo-x-comms](https://github.com/xpufx/paseo-x-comms)

---

## Agent Guidelines & Skills

If available in your workspace or agent environment, review the **`coding-agent` skill** (`.agents/skills/coding-agent/SKILL.md` or `.gemini/skills/coding-agent/SKILL.md`). It defines our complete task execution lifecycle, operational heuristics, `fgjx` command conventions, and self-stamping rules.

---

## Critical Priority: `SOS`

`SOS` is our highest-level priority signal:
- **Trumps everything**: An open issue tagged `SOS` preempts all routine work, refactoring, and feature development.
- **Immediate Pickup**: Any available or idle agent must claim an unworked `SOS` issue immediately (`wip`), investigate, and resolve it before proceeding with other queue items.

---

## Issues-Centered Workflow

Day-to-day coordination runs strictly through Forgejo issues, not conversational chat. Agents work quietly in designated local worktrees, communicate deliverables via issue comments, and transition task states through labels. Chat harness context is preserved for high-level steering, architectural decisions, and escalations.

### The `fgjx` CLI Wrapper

The [`fgjx` tool](https://forge.mrs.aager.de/xpufx/paseo-plugin-helper/issues/23) wraps `fgj` to eliminate display and orchestration gaps:
- **Enhanced Issue Listings**: `fgjx issue list` includes a dedicated `LABELS` column and filtering flags (`--sort updated|created`, `--since <date>`, `--not-by <user>`).
- **Formatted Issue Views**: `fgjx issue view <NUM>` displays formatted headers and clean comment threads.
- **Agent Self-Stamping (`--envelope`)**: Automatically appends deterministic `[x-agent]` metadata at the bottom of comments.
- **Full Passthrough**: `fgjx api` and standard subcommands pass through to `fgj` seamlessly.

```bash
# Check issues updated recently
fgjx issue list --sort updated

# View issue details and comment stream
fgjx issue view 40

# Post progress report with mandatory self-stamping
fgjx issue comment 40 --envelope -b "Progress details..."
```

---

## Labels, in Importance Order

Labels dictate dispatch priority and state machine transitions. Label titles below reflect their exact Forgejo badge colors:

| Label | Color | Meaning |
| :--- | :---: | :--- |
| <span style="color:#b60205; font-weight:bold;">●&nbsp;SOS</span> | `b60205` | **Critical emergency — trumps all.** Immediate pickup required. Preempts all other work. |
| <span style="color:#d93f0b; font-weight:bold;">●&nbsp;user-attention</span> | `d93f0b` | Blocked or ambiguous requirements; requires explicit human direction with a clear question. |
| <span style="color:#fbca04; font-weight:bold;">●&nbsp;agent-attention</span> | `fbca04` | Available task signal. If aging with no blocking labels, must be handed out/claimed immediately. |
| <span style="color:#ff9933; font-weight:bold;">●&nbsp;high priority</span> | `ff9933` | Do before routine work. |
| <span style="color:#0e8a16; font-weight:bold;">●&nbsp;green-light</span> | `0e8a16` | Ready for an agent to pick up. |
| <span style="color:#000000; font-weight:bold;">●&nbsp;stop-work</span> | `000000` | Halt all work on this issue immediately. |
| <span style="color:#fbca04; font-weight:bold;">●&nbsp;wip</span> | `fbca04` | An agent is actively working on it (must be set on claim). |
| <span style="color:#7057ff; font-weight:bold;">●&nbsp;ready-for-review</span> | `7057ff` | Work complete, ready for Orchestrator review. |
| <span style="color:#a2eeef; font-weight:bold;">●&nbsp;verify</span> | `a2eeef` | Built, awaiting human verification on device. |
| <span style="color:#a2eeef; font-weight:bold;">●&nbsp;agent-finished</span> | `a2eeef` | Agent completed its check/work (pairs with `agent-attention`). |
| <span style="color:#b60205; font-weight:bold;">●&nbsp;blocker</span> | `b60205` | This issue blocks other issues. |
| <span style="color:#e99695; font-weight:bold;">●&nbsp;blockee</span> | `e99695` | Blocked by another issue. |
| <span style="color:#d73a4a; font-weight:bold;">●&nbsp;security</span> | `d73a4a` | Secrets, credentials, exfiltration surface. |
| <span style="color:#d73a4a; font-weight:bold;">●&nbsp;bug</span> | `d73a4a` | Defect, not a feature. |
| <span style="color:#d4a017; font-weight:bold;">●&nbsp;spec</span> | `d4a017` | Needs a detailed spec before building. |
| <span style="color:#d4c5f9; font-weight:bold;">●&nbsp;triage</span> | `d4c5f9` | Needs initial sorting before entering the queue. |
| <span style="color:#1d76db; font-weight:bold;">●&nbsp;explore</span> | `1d76db` | Initial exploration of an idea, problem space, or existing code. |
| <span style="color:#1d76db; font-weight:bold;">●&nbsp;discussion</span> | `1d76db` | Open question, decide before building. |
| <span style="color:#d4a017; font-weight:bold;">●&nbsp;idea</span> | `d4a017` | Raw idea, not yet shaped. |
| <span style="color:#1d76db; font-weight:bold;">●&nbsp;checklistify-issue</span> | `1d76db` | Make a checklist of deliverables or steps. |
| <span style="color:#1d76db; font-weight:bold;">●&nbsp;format-issue</span> | `1d76db` | Agent reformats issue for clarity. |
| <span style="color:#5319e7; font-weight:bold;">●&nbsp;upstream-check</span> | `5319e7` | Check upstream Paseo PRs, issues, code, and discussions first. |
| <span style="color:#5319e7; font-weight:bold;">●&nbsp;upstream</span> | `5319e7` | Blocked on upstream Paseo changes. |
| <span style="color:#006b75; font-weight:bold;">●&nbsp;audit</span> | `006b75` | Needs a doctor/audit pass. |
| <span style="color:#7f8c8d; font-weight:bold;">●&nbsp;chore</span> | `7f8c8d` | Routine maintenance, no product change. |
| <span style="color:#6e7f80; font-weight:bold;">●&nbsp;meta</span> | `6e7f80` | Repo and Forgejo housekeeping. |
| <span style="color:#0e8a16; font-weight:bold;">●&nbsp;evergreen</span> | `0e8a16` | Living tracker, grows instead of closing. |
| <span style="color:#0e8a16; font-weight:bold;">●&nbsp;new-plugin</span> | `0e8a16` | Idea grown into a plugin proposal. |
| <span style="color:#d4a017; font-weight:bold;">●&nbsp;expensive</span> | `d4a017` | Big build, think before starting. |
| <span style="color:#c2e0c6; font-weight:bold;">●&nbsp;cheap</span> | `c2e0c6` | Small, safe to just do. |
| <span style="color:#cfd3d7; font-weight:bold;">●&nbsp;low priority</span> | `cfd3d7` | Whenever, no urgency. |
| <span style="color:#0366d6; font-weight:bold;">●&nbsp;plugin:helper</span> | `0366d6` | Concerns `paseo-plugin-helper`. |
| <span style="color:#0e8a16; font-weight:bold;">●&nbsp;plugin:top</span> | `0e8a16` | Concerns the `top` plugin. |
| <span style="color:#0e8a16; font-weight:bold;">●&nbsp;plugin:mcp-tools</span> | `0e8a16` | Concerns the `mcp-tools` plugin. |
| <span style="color:#0e8a16; font-weight:bold;">●&nbsp;plugin:x-comms</span> | `0e8a16` | Concerns the `x-comms` plugin. |

---

## Operational Heuristics

1. **Precedence Rule (Recent Updates Over Labels)**:
   Whenever an issue is updated, **the 3 latest comments take precedence over existing static labels**. If context is inconclusive, inspect earlier comments. If new feedback arrived after an agent completed work, the issue is active: strip `agent-finished`, attach `wip`, and execute.
2. **Aging Attention Heuristic**:
   Unblocked issues with `agent-attention` that age without pickup must be claimed immediately by an idle agent or dispatched by the Orchestrator.
3. **Strict Non-Closure Rule**:
   Agents and the Orchestrator **never close issues**. When work is complete, attach `agent-finished` and `verify`. Only the human operator closes issues upon on-device satisfaction.
