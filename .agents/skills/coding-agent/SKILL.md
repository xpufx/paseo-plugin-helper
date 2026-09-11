---
name: coding-agent
description: Workflow, CLI tool usage, self-stamping, and task lifecycle for coding agents picking up issues on Forgejo
---

# Coding Agent Skill

This skill defines the operational workflow, tool usage, issue conventions, and reporting standards for **coding agents** operating behind the shared `@xpufx` user identity.

> [!IMPORTANT]
> **Token Economy Rule**: If you explained or documented something in a Forgejo issue comment, **keep conversation responses in the agent/user harness strictly brief and low-token**. Point directly to the issue number/link; do not duplicate long explanations into chat.

---

## 1. Primary Tool: `fgjx` (Always use `fgjx`, NEVER `fgj` directly)

Interact with the Forgejo task board using `fgjx` (available in `$PATH`).
**Rule**: Always invoke `fgjx`, never bare `fgj`. `fgjx` is a complete passthrough wrapper over `fgj` (including `fgjx api ...`) while adding display enhancements (labels, formatting, envelope stamping).

- **Host**: `forge.mrs.aager.de`
- **Repo**: `xpufx/paseo-plugin-helper` (or target repo in `owner/repo` format)

### Essential Commands

```bash
# List open issues with labels
fgjx --hostname forge.mrs.aager.de -R xpufx/paseo-plugin-helper issue list

# View issue details, labels, and formatted comment history
fgjx --hostname forge.mrs.aager.de -R xpufx/paseo-plugin-helper issue view <NUMBER>

# Post a comment with auto agent-envelope self-stamp
fgjx issue comment <NUMBER> --hostname forge.mrs.aager.de -R xpufx/paseo-plugin-helper --envelope -b "Comment text"

# Call raw API via fgjx (never use bare fgj api)
fgjx api repos/xpufx/paseo-plugin-helper/issues/<NUMBER> --hostname forge.mrs.aager.de
```

> [!IMPORTANT]
> **Clean Markdown & Backticks**: When posting comments via shell or heredocs, do NOT double-escape backticks with backslashes (e.g. avoid `\`\`\`` or `\`code\``). Backslashes display literally on the Forgejo web UI. Use unescaped single quotes, heredocs (`cat << 'EOF'`), or raw file input (`-F file` or python) to preserve clean triple backticks (` ``` `).

> [!NOTE]
> Forgejo hosts the **issues board only** for orchestration and observability. Code repositories live on GitHub or in local checkouts/worktrees.

---

## 2. Issue Referencing & Linking Conventions

When referencing issues in comments, commit messages, or chat harness:
1. **Instance-Qualified Links**: We may have multiple Forgejo/Git instances. Always format issue references with clickable markdown URLs including the instance descriptor, for example:
   `[Issue #47 (forge.mrs)](https://forge.mrs.aager.de/xpufx/paseo-plugin-helper/issues/47)`
2. **Never echo redundant issue numbers**: Do not post naked `#47` inside comments on issue #47 itself without additional context. Reference external/cross-issue links with their full URL and repo/forge context.

---

## 3. Commit Tracking: Explicit Code Host & Commit SHAs

If an issue fix includes a code commit:
1. **Always record the exact commit SHA and the hosting repo URL** (e.g. GitHub origin or worktree).
2. Format as a clickable commit link if public/remote, or list the repository origin remote + branch + SHA:
   `commit: abc1234 on branch v0.8 in github.com/xpufx/paseo-x-comms`
3. Never assume Forgejo holds the code (Forgejo is issues-only). State precisely where the commit was made and where it pushes.

---

## 4. Mandatory: Self-Stamping with Agent Envelope

All agents share authentication under `@xpufx`. Because the Orchestrator does **not** have access to your local agent environment, **you must stamp every issue comment and status update with your own agent envelope** (use `fgjx issue comment <id> --envelope -b ...`).

### Envelope Template

Actual comment text comes first. The agent envelope is placed at the bottom, rendered in `<small>`:

```markdown
<Your actual comment / progress report / deliverable here>

---
<small>

[x-agent] **<AgentName>** (<ShortId>) via <Provider/Model> on <Hostname>

- **agentId**: <Full UUID or session ID>
- **agentName**: <Human/Tab name or role>
- **provider/model**: <e.g. opencode/muse-spark, gemini-3.8-flash, etc.>
- **daemon serverId**: <srv_... if running inside Paseo, host machine name>
- **workspace**: <Absolute path to worktree/repo>, branch <branch-name>
- **action at**: <ISO-8601 UTC timestamp>

</small>
```

---

## 5. Steering Labels & Operational Directives

Understand the intent of board labels:

- **`agent-attention`**: Dispatch signal ("Attention agent, this task is available / needs your attention"). This replaces or subsumes `green-light`. When an issue has `agent-attention`, it is open for an agent to inspect, claim, or act upon.
- **Precedence Rule (Recent Updates Over Labels)**: If an issue has a recent update (`updated_at` delta), **recent comments and feedback ALWAYS take precedence over static labels**. Never rely on an existing label (such as `agent-finished` or `green-light`) and move on without inspecting recent activity. **Read the 3 latest comments first** to understand the current state; if that context is inconclusive or references earlier requirements, read a few more comments backwards. If a human or peer agent posted new feedback or instructions after the last agent completion, that issue is active work: strip `agent-finished`, claim with `wip`, and execute.
- **Aging Attention Heuristic**: If an issue has `agent-attention`, has no work-blocking labels (`wip`, `stop-work`, `blockee`, `upstream`, `agent-finished`), and has had no action for a reasonable window (> 15-30m or oldest updated), **the Orchestrator MUST hand it out, or an idle Minion MUST claim it**. Stagnation is not permitted.
- **`agent-finished`**: Completed check signal. Attached by the agent alongside `agent-attention` upon finishing its review/work.
- **`user-attention`**: Escalation signal for blocked or ambiguous issues. Used when an issue is sitting and the required deliverable (or next action) is fundamentally unclear.
  - **Strict Guardrail**: Agents may **never** use this label as an excuse to avoid work or offload solvable technical decisions.
  - **Mandatory Requirement**: Whenever applying `user-attention`, the agent **MUST** post a clear, precise comment directly addressing the human user (`@oktay`) stating what options exist and what exact clarification or decision is required to unblock execution.
- **`upstream-check` / `check-upstream`**: Steering instruction. Before implementing custom logic or local workarounds, investigate upstream Paseo code, releases, PRs, issues, or discussions to see what Paseo already provides, plans to support, or how it implements the pattern natively.
- **`upstream`**: Blocked directly on an upstream Paseo capability or bug fix.
- **`format-issue` / `checklistify-issue` / `spec`**: Pre-code steering. Shape requirements, break down deliverables into `- [ ]` checklists, or draft specs. Do **not** begin writing code until requirements are clear and approved.
- **`SOS`**: Highest priority urgent dispatch. Any available coding agent should claim and tackle this immediately.
- **`stop-work`**: Circuit breaker scoped strictly to this issue. If working on this issue, stop immediately—do not commit or push further changes for it.
- **`blockee` / `blocker`**: Dependency indicators. Check linked blocking issues before proceeding.

---

## 6. Task Execution Lifecycle

### Step 1: Discover & Claim Work
1. Look for unblocked issues tagged **`agent-attention`** (available task) or urgent **`SOS`**.
2. If the issue has **`upstream-check`**, first audit upstream Paseo repositories/docs to inform your approach.
3. Check issue comments to verify no other agent has already claimed it.
4. Post an Agent Envelope comment announcing your claim.
5. **Attach the `wip` label immediately** (e.g. `fgjx issue edit <number> --add-label wip`) to indicate active work and prevent duplicate pickup.

### Step 2: Implementation Guidelines
- **Autonomous Execution (`agent-attention`, `cheap`):**
  Work quietly in your designated worktree/checkout without spamming chat.
- **Verification:** Run typechecks (`npm run typecheck`), linters, and test suites locally before claiming completion.

### Step 3: Handoff to `Orchestrator` (`ready-for-review`)
When code is implemented and verified locally:
1. Push your branch/commits.
2. Post a completion comment with your **Agent Envelope** (`fgjx issue comment <number> --envelope -b ...`) including:
   - Summary of changes implemented.
   - Updated checklist showing completed items.
   - Branch name and commit hash(es).
   - Confirmation that typechecks and tests passed.
   - **Mandatory Deployment Status**: Explicitly state runtime requirements (e.g., whether the user needs to run `paseo plugin update <name>`, restart the daemon, or reload the client).
3. **Remove the `wip` label** and attach **`agent-finished`** (keeping `agent-attention`), and signal handoff to the **`Orchestrator`** for review (`ready-for-review`), or tag `verify` for on-device/human verification (`fgjx issue edit <number> --remove-label wip --add-label agent-finished --add-label verify`).
4. **Do NOT close the issue**: Agents and the Orchestrator do not close issues upon completion. The issue must remain `open` with `agent-finished` and `verify` (and/or `ready-for-review`) attached so the human operator can verify and close it.
5. Stand by for fast review from the `Orchestrator` or testing by human user `oktay`.

---

## 7. Chat-to-Issue Promotion (No Unlinked "Cowboy" Commits)

When a human user or peer agent gives an informal instruction, tweak, or bug report directly in chat/composer:
- **Do NOT immediately edit and push unlinked code directly to production branches.**
- **Find or File**: Check if an existing Forgejo issue covers the request. If none exists, file a concise issue (`fgjx issue create -t "..." -b "..." -l "agent-attention,wip"`) before making commits.
- **Audit Trail**: Every change committed to git must be linked to an issue and self-stamped via `--envelope`. This ensures that regression investigations and changelogs always have a documented rationale.

---

## 8. Paseo Workspace & Git Worktree Isolation

- **Shell Branch Hazard**: In Paseo, multiple agents may share the same project directory. If an agent executes `git checkout -b <branch>` or `git checkout <branch>` directly in the shell within a shared directory, **every agent and editor attached to that directory will have their active branch swapped without warning**.
- **Dedicated Worktrees Only**:
  - Never switch branches in a shared root workspace.
  - Isolated branch work must use Paseo-backed Workspaces or dedicated git worktrees (e.g. `~/.paseo/worktrees/<id>/<name>`) tracking non-local branches.
  - When working on shared main/v8 branches, ensure tests and builds are hermetic and uncommitted workspace dirt is not inadvertently swept into commits.

---

## 9. Empirical Verification vs. Assumption-Based Diagnoses

- **No Speculative Conclusions**: When diagnosing runtime failures or data omissions, do not rely solely on reading log snippets or inspecting recent git commits to assume "it was already fixed upstream."
- **Empirical Proof**: Reproduce the behavior locally or inspect the running process/socket. If you conclude an upstream update is needed, explain the exact mechanism that proves it and provide the exact command for the user to pick up the fix (e.g. `paseo plugin update <name>`).
