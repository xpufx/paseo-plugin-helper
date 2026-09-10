# Paseo Orchestration & Issues Board

> **Note**: This Forgejo repository is dedicated to **orchestration, task tracking, and agent lifecycle management**. Codebases and releases live on GitHub:
> - `paseo-plugin-helper`: [github.com/xpufx/paseo-plugin-helper](https://github.com/xpufx/paseo-plugin-helper)
> - `paseo-top`: [github.com/xpufx/paseo-top](https://github.com/xpufx/paseo-top)
> - `paseo-x-comms`: [github.com/xpufx/paseo-x-comms](https://github.com/xpufx/paseo-x-comms)

---

## Issues-Centered Workflow

Day-to-day coordination runs strictly through Forgejo issues, not conversational chat. Agents work autonomously in designated local worktrees, communicate progress via issue comments, and transition task states through labels. Chat harness context is preserved for high-level steering, architectural decisions, and escalations.

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

Labels dictate dispatch priority and state machine transitions:

| Label | Meaning |
| :--- | :--- |
| `SOS` | **Critical emergency — trumps all.** Immediate pickup required. |
| `user-attention` | Blocked or ambiguous requirements; requires explicit human direction with a clear comment. |
| `agent-attention` | Available task signal. If aging with no blocking labels, must be handed out/claimed immediately. |
| `high priority` | Do before routine work. |
| `green-light` | Ready for an agent to pick up. |
| `stop-work` | Halt all work on this issue immediately. |
| `wip` | An agent is actively working on it (must be set on claim). |
| `ready-for-review` | Work complete, ready for Orchestrator review. |
| `verify` | Built, awaiting human verification on device. |
| `agent-finished` | Agent completed its check/work (pairs with `agent-attention`). |
| `blocker` | This issue blocks other issues. |
| `blockee` | Blocked by another issue. |
| `security` | Secrets, credentials, exfiltration surface. |
| `bug` | Defect, not a feature. |
| `spec` | Needs a detailed spec before building. |
| `triage` | Needs initial sorting before entering the queue. |
| `explore` | Initial exploration of an idea, problem space, or existing code. |
| `discussion` | Open question, decide before building. |
| `idea` | Raw idea, not yet shaped. |
| `checklistify-issue` | Make a checklist of deliverables or steps. |
| `format-issue` | Agent reformats issue for clarity. |
| `upstream-check` | Check upstream Paseo PRs, issues, code, and discussions first. |
| `upstream` | Blocked on upstream Paseo changes. |
| `audit` | Needs a doctor/audit pass. |
| `chore` | Routine maintenance, no product change. |
| `meta` | Repo and Forgejo housekeeping. |
| `evergreen` | Living tracker, grows instead of closing. |
| `new-plugin` | Idea grown into a plugin proposal. |
| `expensive` | Big build, think before starting. |
| `cheap` | Small, safe to just do. |
| `low priority` | Whenever, no urgency. |
| `plugin:helper` | Concerns `paseo-plugin-helper`. |
| `plugin:top` | Concerns the `top` plugin. |
| `plugin:mcp-tools` | Concerns the `mcp-tools` plugin. |
| `plugin:x-comms` | Concerns the `x-comms` plugin. |

---

## Operational Heuristics

1. **Precedence Rule (Recent Updates Over Labels)**:
   Whenever an issue is updated, **the 3 latest comments take precedence over existing static labels**. If context is inconclusive, inspect earlier comments. If new feedback arrived after an agent completed work, the issue is active: strip `agent-finished`, attach `wip`, and execute.
2. **Aging Attention Heuristic**:
   Unblocked issues with `agent-attention` that age without pickup must be claimed immediately by an idle agent or dispatched by the Orchestrator.
3. **Strict Non-Closure Rule**:
   Agents and the Orchestrator **never close issues**. When work is complete, attach `agent-finished` and `verify`. Only the human operator closes issues upon on-device satisfaction.
