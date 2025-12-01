# How to Create a Hotfix

This guide explains the process of creating and deploying a hotfix to production for Iaso.

## Overview

Hotfixes are used to quickly patch critical bugs in production. Unlike regular features that go through the `develop` branch, hotfixes are created from the latest production release and merged directly to `main`.

## Prerequisites

- Ensure you have the latest code from `main`:
    ```bash
    git fetch --all
    ```

## Step-by-Step Process

### 1. Create a Hotfix Branch

Create a new branch from `main`. Use the prefix `HOTFIX` or `hotfix/`:

```bash
# Checkout and update main branch
git checkout main
git pull origin main

# Create your hotfix branch
git checkout -b HOTFIX-TICKET-NUMBER-describe-your-fix
# OR
git checkout -b hotfix/TICKET-NUMBER-describe-your-fix
```

**Alternative:** If you already have the fix in another branch, you can create the hotfix branch and cherry-pick your commits:

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b HOT-FIX-TICKET-NUMBER-describe-your-fix

# Cherry-pick your commit(s) from another branch
git cherry-pick <commit-hash>
```

### 2. Make Your Changes

Make the necessary fixes and commit them:

```bash
# Make your changes
# ... edit files ...

# Stage and commit
git add .
git commit -m "fix: describe your hotfix"
```

### 3. Add a Release Tag

First, check the latest tag

- On [GitHub Tags](https://github.com/BLSQ/iaso/tags)
- Using `git log`

Then create a new tag with an alphabetical increment:

```bash
# If the latest tag was v2025.11.18b, create v2025.11.18c
git tag -a v2025.11.18c -m "Hotfix: describe your fix"
```

**Tag naming convention:**

- Use the same date as the previous release
- Increment the letter suffix: `a` → `b` → `c` → etc.
- Example progression: `v2025.11.18a` → `v2025.11.18b` → `v2025.11.18c`

### 4. Push the Hotfix Branch

Push your hotfix branch, with the tags to GitHub:

```bash
git push origin HOT-FIX-TICKET-NUMBER-describe-your-fix
git push --tags # OR
git push origin v2025.11.18c
```

### 5. Create a Pull Request

Create a Pull Request targeting the `main` branch.

### 6. Review and Merge

- Wait for code review approval
- Ensure all CI/CD checks pass
- Once approved, **squash and merge the PR to `main`** following [conventional commits standard](https://www.conventionalcommits.org/en/v1.0.0/#summary). If you're squashing several commits, make sure to leave a clear description of the changes

**NOTE**: if you make changes after the review, move the tag to the approved commit and force push it:

```bash
git push --tags --force
```

### 6. Pull Main Locally

After the PR is merged, update your local `main` branch:

```bash
git checkout main
git pull origin main
```

### 9. Verify the Tag

Verify that the tag appears on GitHub:

- Visit [GitHub Tags](https://github.com/BLSQ/iaso/tags), or use `git log`
- Confirm your new tag is listed

### 10. Backport to Develop

**Important:** After the hotfix is deployed, backport the changes to the `develop` branch to ensure the fix is included in future releases:

Create a PR from `main` to `develop`:

```bash
# Checkout develop
git checkout develop
git pull origin develop

# Create proper fix branch
git checkout develop
git checkout -b TICKET-NUMBER-describe-your-fix
```

If the hotfix changes are good enough to pass standard review, cherry-pick the changes:

```bash
# Cherry-pick the hotfix commit(s)
git cherry-pick <commit-hash>
git push origin <your branch>
```

If some shortcuts had to be taken, e.g: extensive testing was not added, improve the fix to meet the review standard and remove the shortcuts taken.

In any case, open a regular pull request so the ticket can be included in the release

## Quick Reference Commands

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b HOT-FIX-TICKET-NUMBER-describe-your-fix

# 2. Make changes and commit
git add .
git commit -m "fix: your fix description"

# 3. Push branch
git push origin HOT-FIX-TICKET-NUMBER-describe-your-fix

# 4. After PR is merged, pull main
git checkout main
git pull origin main

# 5. Create and push new tag (check latest tag first)
git tag -a v2025.11.18c -m "Hotfix: description"
git push origin v2025.11.18c

# 6. Backport to develop
git checkout develop
git pull origin develop
git cherry-pick <commit-hash>
git push origin develop
```
