# Write submissions with the API

`/api/submissions/` creates and changes submissions from their answers as JSON, without writing their XML. The XML is
built and checked by [odk_cli](https://github.com/BLSQ/odk_cli), the engine of ODK Collect: the form's calculations,
relevance, required questions and constraints apply as on a phone.

Get a token as in [Use the APIs](use_iaso_apis.md); the user needs the "Edit submissions" permission (reading needs
"Submissions").

## The content

`content` has the shape of a submission's `json` (as `GET /api/instances/{id}/` or `GET /api/submissions/{id}/`
return it):

- the answers by question name, groups left out: `{"head_name": "Alice", "population": 7}`;
- a repeat group as a list, one object per repeat: `"child": [{"child_name": "Bob"}, {"child_name": "Eve"}]`;
- a "select multiple" as a list or a space-separated text: `["fever", "cough"]`;
- `_version`: the form version (the latest one if absent); any version of the form can be used.

Values the form computes (calculations, `start`, `deviceid`...) are computed by the server. They can be sent back as
read: a calculation sent is compared with the computed one and the submission refused if they differ
(`CALCULATION_MISMATCH`); values that depend on the time (`now()`, `today()`, `start`...) are only reported in
`warnings`. The org unit's values (`current_ou_name`, `parent1_ou_id`...) are filled from `org_unit_id`.

## Create

```bash
curl -X POST "$IASO/api/submissions/" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "submissions": [
      {
        "ref": "row-12",
        "uuid": "6f1c4a1e-0d3b-4b8e-9d1a-2a9f0c6b1e01",
        "form_id": 12,
        "org_unit_id": 123,
        "period": "202611",
        "content": {"head_name": "Alice", "population": 7, "child": [{"child_name": "Bob", "child_age": 4}]}
      }
    ]
  }'
```

```json
{
  "results": [
    {"ref": "row-12", "status": "created", "id": 456, "uuid": "6f1c4a1e-…", "form_version": "2026110801"}
  ],
  "import_id": 9812
}
```

- 1 to 100 submissions per request, **all or none**: if one is refused, nothing is saved.
- `uuid`: sending the same submission again (a retry after a timeout) answers `"status": "unchanged"`; another
  content with the same uuid is refused (`CONFLICT`, use `PATCH`). Generated when absent.
- `ref`: your own key (a row number), repeated in the results. Defaults to the position in the list.
- Optional: `project_id` (required when the form is in several projects), `source_created_at`, `location`
  (`latitude`, `longitude`, `altitude`, `accuracy`), `entity` (below).
- `?dry_run=true`: checks everything, saves nothing.
- `import_id`: every request is kept, refused or not, in the API imports.

### Refused

`400`, the problems of every submission, `field` pointing into what was sent:

```json
{
  "results": [
    {
      "ref": "row-12",
      "status": "refused",
      "errors": [
        {"code": "CONSTRAINT", "field": "content.child[1].child_age", "question": "child/child_age",
         "message": "Under 5 only", "answer": "7"},
        {"code": "REQUIRED", "field": "content.head_name", "question": "household/head_name",
         "message": "Answer is required"}
      ]
    }
  ],
  "import_id": 9813
}
```

`503`: the submissions can't be checked right now; send them again later.

### With files

A photo or a document is sent as `multipart/form-data`: the JSON in a `payload` part, one part per file. The
question's answer is the part's name.

```bash
curl -X POST "$IASO/api/submissions/" -H "Authorization: Bearer $TOKEN" \
  -F 'payload={"submissions": [{"form_id": 12, "org_unit_id": 123, "period": "202611",
                                "content": {"head_name": "Alice", "photo": "front.jpg"}}]}' \
  -F "front.jpg=@front.jpg"
```

A file no answer names, or an answer naming a file not sent, refuses the request.

### Entities

`"entity": {"uuid": "…", "entity_type_id": 4}`:

- with the entity type's registration form (its reference form), the submission registers a new entity (the uuid is
  generated if absent, and returned as `entity_uuid`);
- with another form, it follows an existing entity, or one registered earlier in the same request.

## Read

`GET /api/submissions/{id}/` returns a submission in the shape `POST` and `PATCH` take, with `updated_at`.

## Change

```bash
curl -X PATCH "$IASO/api/submissions/456/" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"content": {"population": 8, "child": [{}, {"child_name": "Eve"}]}, "expected_updated_at": "2026-11-08T10:00:00.123456Z"}'
```

- `content` is merged into the submission: a question sent is set, `null` clears it, a question not sent is left as
  it is. In a repeat, the list gives the repeats by position: `{}` leaves one as it is, a longer list adds repeats.
- `org_unit_id` and `period` can change too; the org unit's values (`current_ou_name`...) follow.
- `expected_updated_at` (optional): refused (`CONFLICT`) if the submission changed since it was read.
- The whole submission must be valid afterwards. Moving a submission to another form version isn't supported yet.
- `?dry_run=true`: answers the submission as it would be, saves nothing.
- Answers `{"submission": {...}, "warnings": [...]}`, or `400` with `{"errors": [...]}`.
