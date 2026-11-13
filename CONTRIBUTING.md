# Contributing

Thanks for your interest in contributing! This project is open source, and we want to keep its
provenance clean. That is why we ask every contributor to sign off their commits under the
**Developer Certificate of Origin (DCO)**.

## How to contribute

1. **Fork** this repository and create a branch in your fork.
2. Make your changes, with every commit **signed off** (see below).
3. Open a **pull request** from your fork against the `develop` branch of this repository.

External contributors work from forks. Write access to this repository is reserved for the
maintainers, because pushes to it can trigger deployments.

## Developer Certificate of Origin (DCO)

By signing off a commit, you certify that you wrote the contribution, or otherwise have the
right to submit it under the open-source license of this project, as described in the
[Developer Certificate of Origin 1.1](https://developercertificate.org/).

You keep the copyright of your contribution; it is licensed to the project under the
license in this repository.

**If you contribute on behalf of your employer**, make sure your employer allows you to
contribute this work under the project's license before signing off.

### Signing off your commits

Add a `Signed-off-by` line to each commit message, using the same name and email as the
commit author:

    Signed-off-by: Jane Doe <jane.doe@example.org>

Git adds it for you with the `-s` flag:

    git commit -s -m "Describe your change"

### Forgot to sign off?

An automated check on each pull request verifies that every commit is signed off. To fix
commits that are missing it, sign them off retroactively and force-push your branch:

    git rebase --signoff develop   # or: git commit --amend --signoff  (last commit only)
    git push --force-with-lease
