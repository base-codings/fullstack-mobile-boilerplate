# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Role & Responsibilities

Your role is to analyze user requirements, delegate tasks to appropriate sub-agents, and ensure cohesive delivery of features that meet specifications and architectural standards.

## Workflows

- Primary workflow: `./.claude/rules/primary-workflow.md`
- Development rules: `./.claude/rules/development-rules.md`
- Orchestration protocols: `./.claude/rules/orchestration-protocol.md`
- Documentation management: `./.claude/rules/documentation-management.md`
- And other workflows: `./.claude/rules/*`

**IMPORTANT:** Analyze the skills catalog and activate the skills that are needed for the task during the process.
**IMPORTANT:** DO NOT modify skills in `~/.claude/skills` directory directly. **MUST** modify skills in this current working directory. Unless you are asked to do so.
**IMPORTANT:** You must follow strictly the development rules in `./.claude/rules/development-rules.md` file.
**IMPORTANT:** Before you plan or proceed any implementation, always read the `./README.md` file first to get context.
**IMPORTANT:** Sacrifice grammar for the sake of concision when writing reports.
**IMPORTANT:** In reports, list any unresolved questions at the end, if any.

## Git

**DO NOT** use `chore` and `docs` in commit messages of file changes in `.claude` directory.

## Hook Response Protocol

### Privacy Block Hook (`@@PRIVACY_PROMPT@@`)

When a tool call is blocked by the privacy-block hook, the output contains a JSON marker between `@@PRIVACY_PROMPT_START@@` and `@@PRIVACY_PROMPT_END@@`. **You MUST use the `AskUserQuestion` tool** to get proper user approval.

**Required Flow:**

1. Parse the JSON from the hook output
2. Use `AskUserQuestion` with the question data from the JSON
3. Based on user's selection:
   - **"Yes, approve access"** → Use `bash cat "filepath"` to read the file (bash is auto-approved)
   - **"No, skip this file"** → Continue without accessing the file

**Example AskUserQuestion call:**
```json
{
  "questions": [{
    "question": "I need to read \".env\" which may contain sensitive data. Do you approve?",
    "header": "File Access",
    "options": [
      { "label": "Yes, approve access", "description": "Allow reading .env this time" },
      { "label": "No, skip this file", "description": "Continue without accessing this file" }
    ],
    "multiSelect": false
  }]
}
```

**IMPORTANT:** Always ask the user via `AskUserQuestion` first. Never try to work around the privacy block without explicit user approval.

## Python Scripts (Skills)

When running Python scripts from `.claude/skills/`, use the venv Python interpreter:
- **Linux/macOS:** `.claude/skills/.venv/bin/python3 scripts/xxx.py`
- **Windows:** `.claude\skills\.venv\Scripts\python.exe scripts\xxx.py`

This ensures packages installed by `install.sh` (google-genai, pypdf, etc.) are available.

**IMPORTANT:** When scripts of skills failed, don't stop, try to fix them directly.

## [IMPORTANT] Consider Modularization
- If a code file exceeds 200 lines of code, consider modularizing it
- Check existing modules before creating new
- Analyze logical separation boundaries (functions, classes, concerns)
- Use kebab-case naming with long descriptive names, it's fine if the file name is long because this ensures file names are self-documenting for LLM tools (Grep, Glob, Search)
- Write descriptive code comments
- After modularization, continue with main task
- When not to modularize: Markdown files, plain text files, bash scripts, configuration files, environment variables files, etc.

## Documentation Management

All important docs live in `./docs/` (canonical English). Translations mirror the same paths under `docs/languages/{vi,zh,ko}/`. The release changelog lives at the **repository root** (`/CHANGELOG.md`), translated mirrors at `docs/languages/{vi,zh,ko}/CHANGELOG.md`.

```
mobile-boilerplate/
├── README.md                   ← project README (root, English)
├── CHANGELOG.md                ← release notes (root, English; auto-updated by semantic-release)
└── docs/
    ├── README.md               ← docs index
    ├── overview.md             ← scope, audience, out-of-scope
    ├── architecture.md         ← layers, data flow, envelope shape
    ├── codebase-map.md         ← file tree + quick-reference
    ├── code-standards.md       ← naming, file size, TS/Dart style, tests, commits
    ├── design-guidelines.md    ← Material 3 theme, typography, spacing
    ├── feature-boundaries.md   ← module isolation rules (no cross-imports)
    ├── dependency-injection.md ← NestJS providers, Riverpod overrides
    ├── i18n-guide.md           ← ARB workflow, translation, locales
    ├── deployment.md           ← Docker, signing, semantic-release flow
    ├── guides/
    │   ├── getting-started.md  ← prereqs, clone, configure, run
    │   ├── backend-module.md   ← NestJS module recipe
    │   ├── prisma-module.md    ← database model recipe
    │   ├── flutter-feature.md  ← Flutter feature recipe
    │   └── api-contract.md     ← OpenAPI codegen flow
    ├── languages/
    │   ├── vi/                 ← Vietnamese mirrors (same filenames)
    │   ├── zh/                 ← Simplified Chinese mirrors
    │   └── ko/                 ← Korean mirrors
    └── journals/               ← EXCLUDED from translation (technical history only)
```

### Multi-language Docs Rule (MANDATORY)

1. **English is the default/canonical language.** New docs are written in English at the root of `docs/` (or root of any non-language subfolder).
2. **Translations mirror structure.** For every new file `docs/<path>/<name>.md`, create `docs/languages/{vi,zh,ko}/<path>/<name>.md` with the same relative path.
3. **Language switcher header** — every doc file MUST carry a blockquote header right after its H1 title:

   ```markdown
   > 🌐 **Language:** **English** · [Tiếng Việt](languages/vi/FILE.md) · [中文](languages/zh/FILE.md) · [한국어](languages/ko/FILE.md)
   ```

   For translated files, bold the current language and use relative paths back to the English root and sibling languages.
4. **Exception — `docs/journals/`** is EXCLUDED from translation (ephemeral technical history).
5. **Root `README.md`** follows the same rule: English at project root, translations at `docs/languages/{vi,zh,ko}/README.md`.
6. **Root `CHANGELOG.md`** follows the same rule: English at project root, translations at `docs/languages/{vi,zh,ko}/CHANGELOG.md`. Release entries (auto-generated by `semantic-release`) stay in English across all mirrors — only descriptive headers/sections are translated.
7. **Applies to all non-language subfolders of `docs/`.** If you create `docs/guides/onboarding.md`, also create `docs/languages/vi/guides/onboarding.md` (and zh, ko).
8. **Translation scope:** translate prose, headings, link text. Preserve code blocks, inline code, file paths, URLs, function/type/variable names, and project-specific identifiers verbatim.

### Naming conventions for new docs

- Prefer short, role-neutral filenames: `overview.md`, `architecture.md`, `deployment.md`.
- Avoid jargon-heavy suffixes (`-pdr`, `-summary`, `-tone-guide`, `-factory-pattern`) — use plain descriptive names.
- Recipes go under `docs/guides/` with task-shaped names: `backend-module.md`, `flutter-feature.md`.

**IMPORTANT:** *MUST READ* and *MUST COMPLY* all *INSTRUCTIONS* in project `./CLAUDE.md`, especially *WORKFLOWS* section is *CRITICALLY IMPORTANT*, this rule is *MANDATORY. NON-NEGOTIABLE. NO EXCEPTIONS. MUST REMEMBER AT ALL TIMES!!!*