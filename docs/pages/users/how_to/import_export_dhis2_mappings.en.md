# Import and export DHIS2 mappings

To export submissions to DHIS2, each question of a form is mapped to a DHIS2 data element (see the
"DHIS2 mappings" section of the [user guide](../reference/user_guide.md)). This page explains how to
reuse those mappings instead of redoing them by hand.

## A mapping per form version

A mapping is attached to one **version** of a form, not to the form itself: questions can be added,
removed or renamed from one version to the next.

When you upload a new version of a form, IASO copies the mappings of the previous version:

- mappings of questions still present in the new version are kept;
- mappings of questions that no longer exist are dropped;
- new questions are not mapped yet: map them, or mark them as never mapped.

## Export the mappings of a version

On the mapping page of a form version, click **Export mappings**. A `.json` file is downloaded with
the question mappings and the DHIS2 dataset (aggregate mappings) or program (event and tracker
mappings) they target. Questions marked as never mapped are not exported.

Use it to keep a copy before a big change, or to copy the mappings to another server or account.

## Import mappings

On the mapping page of the form version to complete, click **Import mappings**. Nothing is changed
until you confirm the last step.

### 1. Pick the mappings to reuse

Choose either:

- another **version of the same form** that uses the same DHIS2 data source, or
- a **mapping export** (`.json`), for example made on another account or another server.

A file is refused when it is not a mapping export, or when it was made for another mapping type
(e.g. a tracker export into an aggregate mapping). When it was made for another DHIS2 dataset or
program, a warning asks you to check that its data elements belong to this one.

### 2. Review the differences

The incoming mappings are compared with the current ones, question by question, in four tabs:

| Tab | What it contains | Default decision |
|---|---|---|
| **Conflicts** | the question is already mapped (or marked as never mapped) to something else | **Keep** the current mapping |
| **To add** | the question is not mapped yet in this version | **Add** the incoming mapping |
| **Identical** | same DHIS2 target on both sides, nothing to resolve | no change |
| **Dropped** | cannot be imported: the question does not exist in this version, or the mapping is not valid for this mapping type | not imported |

For each conflict, choose **Keep** or **Overwrite**; for each addition, **Add** or **Skip**. The
buttons above the table decide for all the rows of the tab at once (**Keep current everywhere**,
**Overwrite everywhere**, **Add all**, **Skip all**).

### 3. Apply

Click **Apply** (the button shows the number of changes). A message sums up how many mappings were
added, overwritten, kept and not imported.

!!! warning
    The DHIS2 ids of the imported mappings are not checked against DHIS2. If a data element does not
    exist in the target dataset or program, the error only shows up when exporting submissions.

## Go back to a previous mapping

Every change of a mapping version, including an import, is recorded. On the mapping page, the
**Link to changes log** shows the history, with the mappings before and after each change: use it
to find a mapping that was overwritten by mistake.
