# CLAUDE.md

This file exists so Claude Code picks up this repository's agent instructions.
It deliberately holds no guidance of its own.

## Read AGENTS.md first, then the plan

**[AGENTS.md](./AGENTS.md) is the single source of truth** for the rules:

- What this repository replaces (`nxgt-maizzle`) and what it deliberately does
  not do — one HTML file per language, a template engine at run time,
  `@nxgt/i18n`
- The inherited invariant — *an absence is `null`, a failure throws* — for a
  transport and for the build
- Escaping, the casing rule, generated code in `generated/`, and how type
  safety is **measured**
- The packages, presets, and the rules carried over from `nxgt-janus`

**[docs/plan.md](./docs/plan.md) is the work**, in order, each step with its
**Done when**. Start at the first step that is not done.

## Keeping it that way

Add new agent guidance to `AGENTS.md`, never here. This file should only ever
grow content that is genuinely Claude Code-specific — skills, slash commands,
hooks, or settings that would make no sense to a different agent.
