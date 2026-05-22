# Entities Deduplication System

## Overview

The entities deduplication system is designed to identify and manage potential duplicate entities within the Iaso platform.

It provides a flexible framework for detecting duplicates using various algorithms and allows users to review, merge, or ignore potential duplicates.

## Core Components

### 1. Deduplication Algorithms

The system supports multiple deduplication algorithms.

Currently, only the Levenshtein algorithm is supported:

- **Levenshtein Algorithm**:
  - It uses string distance to compare text fields
  - Configurable parameters:
    - `levenshtein_max_distance`: Maximum allowed distance (default: 3)
    - `above_score_display`: Minimum score to display (default: 50)
  - Supports different field types:
    - Text fields: Uses Levenshtein distance
    - Numeric fields: Compares relative differences
    - Boolean fields: Direct comparison
    - Date/Time fields: Compares timestamps

#### Entity Similarity Parameters

When comparing entities (e.g. health facilities, campaigns) Iaso uses the Levenshtein distance algorithm to detect similar names. Two parameters control which matches are considered relevant:

##### 1. `levenshtein_max_distance` (max_distance)

Represents the maximum number of single-character edits (insertions, deletions, substitutions) allowed between two strings.

If the Levenshtein distance between two names is greater than this value, the match is discarded.

This is a hard cutoff independent of string length.

**Examples** (max_distance = 2):

- "kitten" vs "sitten" → distance = 1 → ✅ kept
- "kitten" vs "sittin" → distance = 2 → ✅ kept  
- "kitten" vs "sitting" → distance = 3 → ❌ rejected

Use this to prevent unrelated matches from being considered, even if they score relatively high on percentage similarity for long strings.

##### 2. `above_score_display` (percentage similarity)

Represents the minimum normalized similarity score required to display a potential match in the UI.

The score is computed as:

```
similarity = (1 - levenshtein(a,b) / max(len(a), len(b))) × 100
```

Expressed as a percentage between 0% (completely different) and 100% (exact match).

**Examples**:

- "kitten" vs "sitting" → distance = 3, max length = 7
  → similarity = 1 - 3/7 = 0.57 → 57%

- "hopital" vs "hospital" → distance = 1, max length = 8
  → similarity = 1 - 1/8 = 0.875 → 87.5%

If `above_score_display = 80`, then only matches with similarity ≥ 80% are displayed.

### 2. Add a Deduplication Algorithm

To add an algorithm:

1. create a file with the algorithm name in `iaso/api/deduplication/algos/`
    - e.g. `levenshtein.py`
2. inside that file, create a class for that algorithm that derives from `iaso.api.deduplication.base.DeduplicationAlgorithm`
3. add the algorithm to `iaso.models.deduplication.PossibleAlgorithms`
4. enable the algorithm in `iaso.tasks.run_deduplication_algo.run_deduplication_algo`

This seems like a lot of steps, but it simplifies the understanding of the system until we have to manage dozens of algorithms.

### 3. Entity Duplicate Analysis

The system provides an API to run deduplication analysis:

```
POST /api/entityduplicates_analyzes/
{
    "algorithm": "levenshtein",
    "entity_type_id": "string",
    "fields": ["field1", "field2"],
    "parameters": {
        "param1": "value1"
    }
}
```

`entity_type_id` is the `id` of the entity type to analyze.

`fields` are the fields to compare.

`parameters` are the parameters to pass directly to the algorithm (for example, `levenshtein_max_distance` can be passed to change from default value)

### 4. Duplicate Management

Once duplicates are identified, they can be managed through several actions:

#### Viewing Duplicates

- List all potential duplicates
- View detailed comparison of duplicate entities
- Filter duplicates by various criteria:
  - Entity type
  - Similarity score
  - Organization unit
  - Form
  - Date range
  - Search terms

#### Handling Duplicates

1. **Merge Entities**
   - Combine two entities into a new entity
   - Select which values to keep from each entity
   - Preserves all instances from both entities
   - Maintains audit trail of the merge

2. **Ignore Duplicates**
   - Mark duplicates as ignored
   - Provide reason for ignoring
   - Prevents future processing of ignored pairs

### 5. Validation Status

Duplicates can have one of three statuses:

- `PENDING`: Initial state, awaiting review
- `VALIDATED`: Duplicates have been merged
- `IGNORED`: Duplicates have been marked as not duplicates

## API Endpoints

### Entity Duplicates

- `GET /api/entityduplicates/`: List potential duplicates
- `GET /api/entityduplicates/detail/`: Get detailed comparison
- `POST /api/entityduplicates/`: Merge or ignore duplicates

### Analysis

- `GET /api/entityduplicates_analyzes/`: List analyses
- `POST /api/entityduplicates_analyzes/`: Start new analysis
- `GET /api/entityduplicates_analyzes/{id}/`: Get analysis status
- `PATCH /api/entityduplicates_analyzes/{id}/`: Update analysis status
- `DELETE /api/entityduplicates_analyzes/{id}/`: Delete analysis

## Security and Permissions

- Requires authentication
- Two permission levels:
  - `iaso_entity_duplicates_read`: View duplicates
  - `iaso_entity_duplicates_write`: Create analyses and manage duplicates
