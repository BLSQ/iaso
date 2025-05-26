# Entities Deduplication System

## Overview
The entities deduplication system is designed to identify and manage potential duplicate entities within the Iaso platform. It provides a flexible framework for detecting duplicates using various algorithms and allows users to review, merge, or ignore potential duplicates.

## Core Components

### 1. Deduplication Algorithms
The system supports multiple deduplication algorithms through a plugin architecture (at the moment, only the Levenshtein algorithm is supported):

- **Levenshtein Algorithm**: Uses string distance to compare text fields
  - Configurable parameters:
    - `levenshtein_max_distance`: Maximum allowed distance (default: 3)
    - `above_score_display`: Minimum score to display (default: 50)
  - Supports different field types:
    - Text fields: Uses Levenshtein distance
    - Numeric fields: Compares relative differences
    - Boolean fields: Direct comparison
    - Date/Time fields: Compares timestamps

### 2. Entity Duplicate Analysis
The system provides an API to run deduplication analysis:

```python
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

The entity_type_id is the id of the entity type to analyze.
The fields are the fields to compare.
The parameters are the parameters to pass directly to the algorithm (for example levenshtein_max_distance can be passed to change from default valu)

### 3. Duplicate Management
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

### 4. Validation Status
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

