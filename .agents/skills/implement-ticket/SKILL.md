---
name: implement-ticket
description: "Implement one ticket as a single vertical slice: fetch the ticket and parent spec, check blockers, resolve material ambiguity, build with TDD, report evidence against acceptance criteria, leave changes ready for review."
disable-model-invocation: true
---

# Implement Ticket

Implement **one ticket** as one **vertical slice**. Complements `/implement` (lightweight, same session) and `/implement-spec` (whole **task graph**): this is the repeatable per-ticket workflow for interactive or autonomous runs.

**Hard bound:** implement only this vertical slice.

## Preconditions

1. Read root `AGENTS.md` or `CLAUDE.md` (whichever exists) and follow its `## Agent skills` pointers for the issue tracker and domain docs.
2. If those pointers are missing, stop and tell the user to run `/setup-matt-pocock-skills`.
3. Require a ticket reference (argument, URL, id, or path). Missing or ambiguous reference: **interactive** → ask; **autonomous** → stop.
4. Inspect the working tree. Note existing dirty files; leave unrelated changes untouched for the whole run.

Discover tracker operations, label names, glossary/ADR locations, and validation commands from those pointers and the repo environment.

## Mode

Detect once at start:

- **Interactive** — a human can answer mid-run (default when a person invoked this skill).
- **Autonomous** — no human turn mid-run (AFK/factory run, or the user said autonomous/AFK).

**Material ambiguity** is anything that would change the slice's shape, acceptance criteria, architecture, or security posture. Interactive asks until resolved. Autonomous stops and leaves a blocker note on the ticket (tracker doc's comment operation), unless the ticket itself already authorises a stated assumption — then record that assumption in the report and continue. Scope is only what the ticket and resolved answers state.

When nothing material is ambiguous, proceed without waiting for approval.

## Steps

### 1. Retrieve the ticket and its parent specification

Fetch the ticket via the tracker doc ("fetch the relevant ticket" / read operation). State its title. Fetch the parent specification when the ticket links one (parent issue, "Part of", or body pointer). If there is no parent, say so and continue from the ticket alone.

**Done when:** title stated; parent fetched or confirmed absent; acceptance criteria listed (or noted as missing).

### 2. Discover domain and architectural context

Follow the domain-docs pointer before exploring code. Load only glossary terms and ADRs that touch this ticket. Explore with **context pointers** (paths, symbols, prior commits) — sparse notes, not dumps.

If the intended approach would contradict an applicable ADR, stop and report the conflict (interactive: ask; autonomous: ticket comment). Do not silently override the ADR.

**Done when:** relevant glossary terms and ADRs named; modules/files in play listed as pointers; no unresolved ADR conflict.

### 3. Check blocking dependencies

Using the tracker doc's blocking / frontier rules, confirm every blocker is done. Open blockers: interactive → report and wait; autonomous → stop with a ticket comment.

**Done when:** this ticket is on the **frontier** (no open blockers).

### 4. Establish scope and resolve material ambiguity

Restate, briefly: intended outcome, in-scope behaviour, explicit out-of-scope, acceptance criteria you will evidence, and any relevant architectural constraints. A one-line proposed approach is enough when it clarifies the slice; skip it when obvious.

Resolve every **material ambiguity** per Mode before writing code. Missing criteria: interactive → agree them; autonomous → stop (or use ticket-authorised assumptions only).

**Done when:** scope is explicit and no unresolved material ambiguity remains.

### 5. Ensure a reviewable branch

Before writing code: if `HEAD` is on the default branch, or the current branch clearly belongs to other work, create or switch to a branch for this ticket. Prefer the repo's branch-naming convention when one is documented; otherwise derive a short name from the ticket id/title. If already on a dedicated branch for this ticket, keep it.

**Done when:** subsequent commits will land on a branch suitable for independent review.

### 6. Implement a single vertical slice

Call the Skill tool with `tdd` at pre-agreed **seams**. One red → green cycle at a time through the ticket's behaviour. Leave pre-existing unrelated working-tree changes untouched.

If implementation surfaces a new ADR conflict or material ambiguity, return to Mode (stop/ask) rather than expanding scope.

**Done when:** the ticket's end-to-end behaviour exists behind the agreed seams.

### 7. Test and validate

Discover validation from the environment (`package.json` scripts, CI config, README). Run the narrowest checks that cover the seams during the loop; run the full relevant suite once at the end when practical. Fix failures inside this slice; note out-of-scope failures in the report and leave them untouched.

Keep tests and checks honest: change production code or fix real failures inside scope; leave the bar in place. Report every relevant check that could not be run.

Inspect the final diff: only this slice's files and hunks.

**Done when:** chosen validation is green (or remaining failures / unrunnable checks are explicitly reported); diff matches the scoped slice.

### 8. Report evidence against acceptance criteria

Produce the report in [REPORT.md](REPORT.md). One row per acceptance criterion: pass / fail / deferred, with evidence. Include manual verification, decisions/assumptions, and outstanding issues.

**Done when:** every criterion has a status and evidence pointer (or an explicit "no criteria on ticket" note); report sections above are filled or marked n/a.

### 9. Leave changes ready for independent review

Commit on the ticket branch when there are changes to review. Call the Skill tool with `code-review` against the branch's fixed point (merge-base with the default branch unless the user named another).

Leave the branch unmerged. Default completion boundaries:

- **Interactive:** leave local (push, open PR, or close/re-label the ticket only when the user asks).
- **Autonomous:** follow the run brief / tracker workflow for push, PR, and ticket state; still leave merge to a human or a later review run.

When a PR is opened, call the Skill tool with `pr` for the body. Attach the evidence report where the next reviewer will find it (ticket comment and/or PR body).

**Done when:** the diff is reviewable cold; evidence report is attached; ownership for the next review step is clear.
