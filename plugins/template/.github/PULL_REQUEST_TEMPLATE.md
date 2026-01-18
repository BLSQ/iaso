What problem is this PR solving? Explain here in one sentence.

Related JIRA tickets : IA-XXX, WC2-XXX, POLIO-XXX

## Self proofreading checklist

- [ ] Did I use eslint and ruff formatters?
- [ ] Is my code clear enough and well documented?
- [ ] Are my typescript files well typed?
- [ ] New translations have been added or updated if new strings have been introduced in the frontend
- [ ] My migrations file are included
- [ ] Are there enough tests?
- [ ] Documentation has been included (for new feature)

## Doc

Tell us where the doc can be found (docs folder, wiki, in the code...).

## Changes

Explain the changes that were made.

The idea is not to list exhaustively all the changes made (GitHub already provides a full diff), but to help the reviewers better understand:

- which specific file changes go together, e.g: when creating a table in the front-end, there usually is a config file that goes with it
- the reasoning behind some changes, e.g: deleted files because they are now redundant
- the behaviour to expect, e.g: tooltip has purple background color because the client likes it so, changed a key in the API response to be consistent with other endpoints

## How to test

Explain how to test your PR.

If a specific config is required explain it here: dataset, account, profile, etc.

## Print screen / video

Upload here print screens or videos showing the changes.

## Notes

Things that the reviewers should know:

- known bugs that are out of the scope of the PR
- other trade-offs that were made
- does the PR depends on a PR in [bluesquare-components](https://github.com/BLSQ/bluesquare-components)?
- should the PR be merged into another PR?

## Follow the Conventional Commits specification

The **merge message** of a pull request must follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.

This convention helps to automatically generate release notes.

Use lowercase for consistency.

[Example](https://github.com/BLSQ/iaso/commit/8b8d7d3064138c1e57878f17b4eb922516ab0112):

```
fix: empty instance pop up

Refs: IA-3665
```

Note that the Jira reference is preceded by a _line break_.

Both the line break and the Jira reference are entered in the _Add an optional extended description…_ field.
