AGENTS.md – Operational Guidelines for Codebase Agents

Overview
- This document describes how to build, lint, test, and review code in this repository.
- It is intended for AI agents and human collaborators who act as automated developers in this workspace.
- When in doubt, prefer explicit, deterministic commands and provide a short rationale for any non-default choice.

Cursor rules
- Cursor rules: none detected in this repository (.cursor/rules or .cursorrules).
- If rules are added later, ensure agents surface their constraints in this document and respect them during edits.

Copilot rules
- Copilot instructions: not detected at repository level (.github/copilot-instructions.md).
- If introduced, these rules take precedence for suggested edits and should be documented here as constraints.

1) Build, lint, and test commands
- The repository is language-agnostic; provide language-specific commands as fallbacks. When a language-specific manifest exists (package.json, pyproject.toml, go.mod, etc.), prefer its commands.
- Common entry points:
  - Build: build artifacts necessary for tests or deployment.
  - Lint: static analysis to catch style and potential errors.
  - Test: run unit/integration tests. Support running a single test by specific selector (name, tag, or path).

- Language-agnostic template commands (fallback):
  - Build: make build || echo "No generic build target" || true
  - Lint: make lint || echo "No generic lint target" || true
  - Test: make test || echo "No generic test target" || true

- Language-specific examples (to be adapted by agents):
  - Node.js / TypeScript
    - Install: npm ci
    - Build: npm run build
    - Lint: npm run lint
    - Test: npm test
    - Run a single test with Jest: npx jest path/to/test.file.test.js -t "test name" or --testNamePattern="^test name$"
  - Python
    - Install: python -m pip install -r requirements.txt
    - Lint: flake8 . or ruff check .
    - Test: pytest -q
    - Run a single test: pytest tests/test_module.py::TestClass::test_method
  - Go
    - Install: go env GOPATH  # ensure module mode if needed
    - Lint: golangci-lint run
    - Test: go test ./...
    - Run a single test: go test -run TestName ./...
  - Rust
    - Build: cargo build
    - Lint: cargo clippy --all-targets --all-features -- -D warnings
    - Test: cargo test
    - Run a single test: cargo test test_name
  - Java (Maven)
    - Build: mvn -B -q package
    - Lint: mvn -DskipTests verify
    - Test: mvn -Dtest=TestName test
  - C/C++
    - Build: cmake . && cmake --build .
    - Lint: cppcheck .
    - Test: ctest or the project's test harness
    - Run a single test: ctest -R regexName

- Default guidance for agents:
  - If a language manifest exists, use its standard scripts first (e.g., npm, pytest, go test).
  - If multiple runtimes exist in the repo, document which one was used in the patch description.
  - When in doubt, run the full suite first, then run targeted tests to isolate failures.

2) Code style guidelines
- General approach: explicit, minimal, deterministic edits; avoid stylistic churn unless it improves clarity or stability.
- Imports and modules
  - Group imports logically: standard library / third-party / local modules.
  - Use blank lines to separate groups.
  - Prefer absolute imports; avoid wildcard imports except for re-exports in some languages.
  - Maintain stable import order across files.
- Formatting and line length
  - Target readable line lengths (120 characters or less when practical).
  - Use spaces for indentation (2 or 4 spaces depending on language conventions in this repo).
  - End files with a trailing newline.
- Types and declarations
  - Prefer explicit types; avoid implicit any in TypeScript; prefer strongly typed values in Go/Rust. Document complex types with comments.
  - Use interfaces for contracts; prefer concrete types for data structures when possible.
  - Use readonly modifiers where data should not be mutated unexpectedly.
- Naming conventions
  - Files: kebab-case when applicable, or language-appropriate conventions.
  - Variables: camelCase; constants: ALL_CAPS or PascalCase depending on language; type names: PascalCase.
  - Functions and methods: camelCase in many languages; PascalCase for constructors/classes.
- Error handling and observability
  - Do not swallow errors; wrap with context and propagate. Include actionable messages.
  - Return meaningful error types or error values rather than generic strings.
  - Prefer explicit error handling in async contexts; avoid unhandled promises.
- Documentation and comments
  - Add concise JSDoc/Doc comments for exported APIs where applicable.
  - Document non-trivial decisions in code comments near the relevant logic.
- Tests and test data
  - Tests should be deterministic and isolated; avoid relying on network I/O or timeouts where possible.
  - Use descriptive test names; follow existing naming conventions.
- Versioning and changelogs
  - When edits touch public interfaces, add a small note in CHANGELOG or MIGRATION.md if present.
- Accessibility and internationalization
  - Consider i18n readiness for UI strings; avoid hard-coding localized content.
- Security and secrets
  - Never commit secrets; add to .gitignore and secret management pipelines. Sanitize test fixtures containing sensitive data.

3) Project structure and conventions
- Keep modules cohesive; one file or module should have a single responsibility.
- Directory layout should reflect logical boundaries (src/, tests/, docs/). Create or use existing conventions.
- Avoid large, monolithic diffs; prefer small, focused patches with clear intent.
- Keep diffs readable with minimal whitespace churn; run linters to surface unintentional changes.

4) Repository hygiene for agents
- Always run tests locally (or in a sandbox) before proposing changes.
- If tests fail due to environment constraints, document the environment and reproduce steps in the PR body.
- Do not push to remote without explicit user instruction.
- When composing commits, provide a brief rationale for the change in the commit message body (the "why").

5) Examples and quick references
- Run a single test in a language (quick templates):
  - Node: npx jest path/to/test.js -t "should do something"
  - Python: pytest tests/test_module.py::TestCase::test_name
  - Go: go test -run TestName ./...
  - Rust: cargo test test_name
  - Java: mvn -Dtest=TestName test
- A minimal lint command examples:
  - Node: npm run lint
  - Python: flake8 .
  - Go: golangci-lint run
  - Rust: cargo fmt --check && cargo clippy -- -D warnings

6) Change history and future work
- This document should be updated when new tooling or conventions are introduced.
- Add cross-language examples for any new language in use.
