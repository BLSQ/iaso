# How to Create a Hotfix

This guide explains the process of creating and deploying a hotfix to production for Iaso.

## Overview

Hotfixes are used to quickly patch critical bugs in production. Unlike regular features that go through the `develop` branch, hotfixes are created from the latest production release and merged directly to `main`.

## Prerequisites

- Ensure you have the latest tags and branches:
  ```bash
  git fetch --all --tags
  ```
- Identify the latest production tag/release (check [GitHub tags](https://github.com/BLSQ/iaso/tags))

## Step-by-Step Process

### 1. Create a Hotfix Branch

Create a new branch from the latest hotfix or release tag. Use the prefix `HOT-FIX` or `hotfix/`:

```bash
# First, checkout the latest production tag
git checkout tags/v2025.11.18b

# Create your hotfix branch
git checkout -b HOT-FIX-TICKET-NUMBER-describe-your-fix
# OR
git checkout -b hotfix/TICKET-NUMBER-describe-your-fix
```

**Alternative:** If you already have the fix in another branch, you can create the hotfix branch and cherry-pick your commits:

```bash
# Create hotfix branch from production tag
git checkout tags/v2025.11.18b
git checkout -b HOT-FIX-describe-your-fix

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

### 3. Push the Hotfix Branch

Push your hotfix branch to GitHub:

```bash
git push origin HOT-FIX-describe-your-fix
```

### 4. Create a Pull Request

Create a Pull Request targeting the `main` branch.

### 5. Review and Merge

- Wait for code review approval
- Ensure all CI/CD checks pass
- Once approved, **merge the PR to `main`**

### 6. Pull Main Locally

After the PR is merged, update your local `main` branch:

```bash
git checkout main
git pull origin main
```

### 7. Create a New Tag

Create a new tag with an alphabetical increment:

```bash
# If the latest tag was v2025.11.18b, create v2025.11.18c
git tag -a v2025.11.18c -m "Hotfix: describe your fix"
```

**Tag naming convention:**
- Use the same date as the previous release
- Increment the letter suffix: `a` → `b` → `c` → etc.
- Example progression: `v2025.11.18a` → `v2025.11.18b` → `v2025.11.18c`

### 8. Push the Tag

Push the new tag to GitHub:

```bash
git push origin v2025.11.18c
```

### 9. Verify the Tag

Verify that the tag appears on GitHub:
- Visit [GitHub Tags](https://github.com/BLSQ/iaso/tags)
- Confirm your new tag is listed

## Quick Reference Commands

```bash
# 1. Fetch latest tags
git fetch --all --tags

# 2. Create hotfix branch from latest release
git checkout tags/v2025.11.18b
git checkout -b HOT-FIX-describe-your-fix

# 3. Make changes and commit
git add .
git commit -m "fix: your fix description"

# 4. Push branch
git push origin HOT-FIX-describe-your-fix

# 5. After PR is merged, pull main
git checkout main
git pull origin main

# 6. Create and push new tag
git tag -a v2025.11.18c -m "Hotfix: description"
git push origin v2025.11.18c

# 7. Backport to develop
git checkout develop
git pull origin develop
git cherry-pick <commit-hash>
git push origin develop
```

