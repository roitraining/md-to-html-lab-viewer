---
name: lab-generator
description: >
  Designs and writes ROI Training hands-on lab manuals as Markdown for the HTML
  Lab Viewer—one folder per lab with images, Overview, Objectives, Tasks, and
  Congratulations. Use when creating labs, lab guides, lab manuals, challenge
  steps, or linking labs from course slide stubs.
---

# Lab Generator Skill

Write **clear, procedural lab manuals** for intermediate professionals. Output compiles in the [HTML Lab Viewer](https://github.com/roitraining/md-to-html-lab-viewer) as a single Markdown document (not slide decks).

**Always read** [examples/lab-template.md](examples/lab-template.md) and copy that structure rather than inventing a new outline.

Labs are **simpler than slide courses**: one story, numbered tasks, copyable commands, screenshots where useful. Prefer doing over lecturing.

---

## 1. Audience and tone

- Default: intermediate practitioners (same audience as the paired slide course unless the user says otherwise).
- Voice: **second person** (*you*), **simple present**, conversational but professional.
- Steps: begin with an **imperative** (Click, Run, Create, Configure…).
- Do **not** use the ampersand character (`&`) in titles or body text—write “and”.

---

## 2. Design workflow

1. Confirm what the learner should **accomplish** (outcomes) and approximate **time** (often 20–30 minutes; match the course lab stub).
2. Outline **Tasks** (usually 3–6) that build sequentially.
3. Write **one lab folder** with Markdown + `images/` (see §3).
4. Add or update the **course slide lab stub** to link this lab (title, time, link only—no lab steps on slides).
5. Run the **Validation checklist** (§9).

---

## 3. Folder and file layout (required)

In the authoring template, labs live under `labs/`:

```text
labs/
  lab-01-getting-started/
    README.md          # preferred filename (Lab Viewer opens README.md for folder URLs)
    images/
      task1-console.png
      architecture.png
  lab-02-remote-state/
    README.md
    images/
```

### Naming

- Folder: `lab-NN-short-kebab-slug` aligned with course chapter/lab numbers when possible.
- Markdown: prefer **`README.md`** so a GitHub folder URL works with the Lab Viewer (`?lab=` on a folder appends `README.md`).
- Images: descriptive names under `images/`; never `image1.png`.

### Image references

Use relative paths from the Markdown file:

```markdown
![Create bucket dialog](images/create-bucket.png)
```

The Lab Viewer resolves relative images against the Markdown file’s directory.

---

## 4. Required lab structure (in order)

| Section | Heading | Notes |
| :--- | :--- | :--- |
| Title | `# …` | Imperative or clear outcome; title case; include key product/tech names |
| Overview | `## Overview` | 1–2 short paragraphs: scenario, why it matters, what they build |
| Objectives | `## Objectives` | Intro line + imperative bullets (complete sentences with ending punctuation) |
| Prerequisites | `## Prerequisites` | Optional but preferred; skills/accounts/tools—not a hard dependency on another lab unless the user requires it |
| Setup | `## Setup` | Account login, project selection, open console/Cloud Shell, clone repo—only what this lab needs |
| Tasks | `## Task N. Title` | Numbered; imperative task title; sentence case after the number |
| Closing | `## Congratulations!` | Brief summary of what they accomplished; no new procedures |

### Task body pattern

Under each `## Task N. …`:

1. One or two sentences: what this task achieves (not the step list).
2. **Numbered steps** (`1.` repeated is fine; renderers renumber)—one primary user action per step when practical.
3. Fenced code with a **language tag**; introduce commands with purpose (“To list regions, run:”).
4. Screenshots for non-obvious UI; **meaningful alt text**; do not screenshot text that belongs in a code block.
5. Callouts sparingly (`> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`, `> [!IMPORTANT]`, `> [!CAUTION]`).

Optional under a task: a short **Success criteria** bullet list when verification matters.

### Objectives wording

```markdown
## Objectives

In this lab, you learn how to:

- Create a VPC network.
- Launch a Compute Engine instance in the network.
```

---

## 5. Lab Viewer Markdown correctness

The Lab Viewer is a single scrolling HTML page (TOC from headings). It supports:

- Standard Markdown (headings, lists, tables, links, images)
- Fenced code blocks with language tags (copy button in the viewer)
- GitHub-style alerts: `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`

**Do not use** Qwiklabs-only tags or fragments (`ql-code-block`, `ql-infobox`, `![[/fragments/…]]`, templated `ql-variable` syntax). Those belong in other publishing systems, not this viewer.

External links are fine; the viewer opens them in a new tab.

---

## 6. Teaching quality bar

- One clear **story**: problem → approach → tasks → accomplishment.
- Prefer **transferable skills** over click-only tourism.
- Keep conceptual asides short; link out for deep docs.
- Tables for three or more related UI field/value pairs on the same screen.
- UI labels in **sentence case** in steps, even if the product UI is all caps.
- When a step ends with text the learner types, omit ending punctuation on that step.

---

## 7. Relationship to slide courses

- Course Generator writes **lab stubs only** on slides (title, time, link).
- This skill writes the **full lab manual** under `labs/`.
- Link example for a stub: relative path or GitHub URL to `labs/lab-01-…/` (folder) or `…/README.md`.

---

## 8. Explicit non-goals

- Do **not** write slide decks here (use Course Generator).
- Do **not** author Qwiklabs YAML, assessments, or `ql-*` markup unless the user explicitly asks for that platform.
- Do **not** invent credentials, project IDs, or secret values—use placeholders like `YOUR_PROJECT_ID`.
- Do **not** leave screenshot references without alt text or without a file / `<!-- TODO IMAGE: … -->`.

---

## 9. Validation checklist

Before delivering:

- [ ] Folder `labs/lab-NN-slug/` with `README.md` and `images/` as needed
- [ ] Structure: Title → Overview → Objectives → (Prerequisites) → Setup → Task 1…N → Congratulations!
- [ ] Objectives are imperative complete sentences with ending punctuation
- [ ] Tasks numbered; steps numbered; code fences have language tags
- [ ] Images use `images/…` relative paths and meaningful alt text (or TODO IMAGE comments)
- [ ] GitHub alerts use correct `[!NOTE]|[!TIP]|[!WARNING]|[!IMPORTANT]|[!CAUTION]` syntax when used
- [ ] No `&` in titles/body; no `ql-*` / fragment syntax
- [ ] Second person, simple present; Congratulations summarizes outcomes only
- [ ] Course slide stub updated with title, time, and link (if a course exists)

---

## 10. Templates

Copy-paste skeleton: [examples/lab-template.md](examples/lab-template.md).
