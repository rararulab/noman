# Issue-Workflow-PR Process Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enforce that noman changes follow Issue → Workflow checks → PR standards.

**Architecture:** Add repository governance artifacts in `.github/` (issue templates, PR template, CI/workflow guards) and document the contribution path in `CONTRIBUTING.md` + README. Validation is automated in PR via GitHub Actions.

**Tech Stack:** GitHub Actions, Markdown templates, Node/TypeScript project scripts.

---

### Task 1: Define contribution policy

**Files:**
- Create: `CONTRIBUTING.md`
- Modify: `README.md`

**Step 1:** Add explicit required flow: open issue first, create branch tied to issue, open PR with issue link, pass CI.

**Step 2:** Document branch naming and commit conventions.

**Step 3:** Update README with a concise “Contribution Flow” section linking to CONTRIBUTING.

### Task 2: Add issue/PR templates

**Files:**
- Create: `.github/ISSUE_TEMPLATE/feature_request.md`
- Create: `.github/ISSUE_TEMPLATE/bug_report.md`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`

**Step 1:** Add feature request template requiring goal, checklist, acceptance criteria.

**Step 2:** Add bug report template requiring repro, expected behavior, impact.

**Step 3:** Add PR template requiring linked issue and verification evidence.

### Task 3: Enforce workflow checks

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/pr-policy.yml`

**Step 1:** Add CI workflow to run `npm ci` and `npm run build` on pull requests.

**Step 2:** Add PR policy workflow to fail if PR body doesn’t include “Closes #<id>”.

**Step 3:** Add PR policy workflow to fail if PR body lacks verification evidence section.

### Task 4: Verify locally

**Files:**
- No code changes; run commands

**Step 1:** Run `npm run build`.

**Step 2:** Review new files for path correctness and consistency.

**Step 3:** Summarize what maintainers should expect after merge.
