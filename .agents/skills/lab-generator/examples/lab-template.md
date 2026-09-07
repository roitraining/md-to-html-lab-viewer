# Lab Generator — copy-paste template

Copy this skeleton when creating a new lab. See [SKILL.md](../SKILL.md) for rules.

Place the file at:

```text
labs/lab-NN-short-slug/README.md
labs/lab-NN-short-slug/images/   # screenshots and diagrams
```

---

````markdown
# Configure Remote State for Terraform

## Overview

In this lab, you configure a remote backend so Terraform state is stored safely
for team use. You create the storage resources, update the backend block, migrate
existing state, and verify locking behavior.

## Objectives

In this lab, you learn how to:

- Create a remote state bucket with versioning enabled.
- Configure a Terraform backend block for remote state.
- Migrate local state to the remote backend.
- Confirm that state locking prevents concurrent applies.

## Prerequisites

- Comfortable with the Linux command line and Git.
- A cloud project with permission to create storage and identity resources.
- Terraform 1.5 or later installed locally (or use Cloud Shell).

## Setup

1. Sign in to your cloud console and select your lab project.
2. Open Cloud Shell (or your local terminal with cloud SDK authenticated).
3. Create a working directory and clone the lab materials if provided:

```bash
mkdir -p ~/terraform-remote-state && cd ~/terraform-remote-state
```

## Task 1. Create the remote state bucket

In this task, you create the storage bucket that holds Terraform state objects.

1. Set your project ID:

```bash
export PROJECT_ID="$(gcloud config get-value project)"
```

1. Create a uniquely named bucket (replace the suffix if needed):

```bash
gcloud storage buckets create "gs://${PROJECT_ID}-tf-state" \
  --project="${PROJECT_ID}" \
  --location="us-central1"
```

1. Enable object versioning on the bucket.

> [!IMPORTANT]
> Use a bucket name that is globally unique. Do not commit real project IDs to shared repos.

<!-- TODO IMAGE: Console screenshot of the new bucket with versioning enabled -->
![Bucket with versioning enabled](images/bucket-versioning.png)

### Success criteria

- The state bucket exists in your project.
- Versioning is enabled on the bucket.

## Task 2. Configure the backend and migrate state

In this task, you point Terraform at the remote backend and migrate local state.

1. Add a backend block to your Terraform configuration.
1. Run an init with migrate flags appropriate to your Terraform version.
1. Confirm that a state object appears in the bucket.

```hcl
terraform {
  backend "gcs" {
    bucket = "YOUR_PROJECT_ID-tf-state"
    prefix = "demo"
  }
}
```

> [!TIP]
> If init asks to migrate existing state, accept the migration so local state is not left behind.

## Task 3. Verify locking

In this task, you observe that a lock prevents a second apply while one is in progress.

1. Start a long-running apply in one terminal (or simulate a lock per your instructor’s guidance).
1. In a second terminal, attempt another apply and note the lock error.
1. Release the lock only after the first operation finishes.

## Congratulations!

You configured remote Terraform state, migrated state to a shared backend, and verified locking. You can apply the same pattern to any team workspace that needs durable, shared state.
````

---

## Image TODO reminder

When you cannot capture a real UI screenshot yet:

```markdown
<!-- TODO IMAGE: Describe exactly what the screenshot should show -->
![Short alt text](images/descriptive-name.png)
```
