# Evidence report

Fill after validation. Attach via the tracker comment operation and/or PR body. Keep it short; point at evidence, don't paste large logs.

```markdown
## Ticket
<tracker reference and title>

## Parent spec
<reference or "none">

## Mode
interactive | autonomous

## Scope
- **Outcome:** <one line>
- **In:** <one or two lines>
- **Out:** <one or two lines>
- **Constraints:** <ADRs / architecture that bound the slice, or "none">

## Acceptance criteria

| Criterion | Status | Evidence |
| --------- | ------ | -------- |
| <AC 1>    | pass / fail / deferred | <test name, command, or path pointer> |
| <AC 2>    | pass / fail / deferred | <…> |

## Validation
- Commands run: <from the environment>
- Result: green | failures (in scope fixed / out of scope noted)
- Could not run: <check and why, or "none">

## Manual verification
<steps a human can take to confirm the behaviour, or "n/a — covered by automated checks">

## Decisions and assumptions
<choices not explicit on the ticket, including ticket-authorised autonomous assumptions, or "none">

## Outstanding issues
<limitations, risks, follow-ups, or "none">

## Review
- Branch: <name>
- Fixed point for `/code-review`: <ref>
- Pushed: yes | no
- PR: <url or "not opened">
```

If the ticket listed no acceptance criteria, replace the table with one line naming what was agreed in step 4 (interactive) or why the run stopped (autonomous).
