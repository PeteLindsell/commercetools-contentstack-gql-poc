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
- **In:** <one or two lines>
- **Out:** <one or two lines>
- **Assumptions** (autonomous only, if any): <ticket-authorised assumptions>

## Acceptance criteria

| Criterion | Status | Evidence |
| --------- | ------ | -------- |
| <AC 1>    | pass / fail / deferred | <test name, command, or path pointer> |
| <AC 2>    | pass / fail / deferred | <…> |

## Validation
- Commands run: <from the environment>
- Result: green | noted failures (out of scope: …)

## Review
- Branch: <name>
- Fixed point for `/code-review`: <ref>
- PR: <url or "not opened">
```

If the ticket listed no acceptance criteria, replace the table with one line naming what was agreed in step 4 (interactive) or why the run stopped (autonomous).
