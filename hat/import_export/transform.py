from typing import Dict
from hat.common.typing import JsonType
from functools import reduce
from pandas import DataFrame, Series

from .errors import handle_import_stage, ImportStage
from .utils import hat_id, create_documentid
from .mapping import MAPPING, IMPORT_CONFIG


def transform_field(
    source_field: JsonType, main_table_name: str, tables: Dict[str, DataFrame]
) -> Series:
    if "fields" in source_field:
        # We have multiple source fields that must be reduced to a single import field
        reduce_func = source_field.get("reduce", None)
        if reduce_func is None:
            raise ValueError(
                'Multifield must have a "reduce" property: {}'.format(source_field)
            )
        result_series = []
        for acc_field in source_field["fields"]:
            if "field" not in acc_field:
                raise ValueError(
                    'Multifield must have a "field" property: {}'.format(source_field)
                )
            result_series.append(transform_field(acc_field, main_table_name, tables))
        # Reduce the result set by combining the result Series one by one after another
        # The result of each combination is used for the next reduce iteration.
        r = reduce(lambda s1, s2: s1.combine(s2, reduce_func), result_series)
        return r

    # We have a single source field that maps to a single import field
    if "field" not in source_field:
        raise ValueError("Specify a field")

    (table_name, field) = source_field["field"]

    # Skip fields which do not exist.
    if field not in tables[table_name]:
        return None

    # Fields in tables different from the main one need to define `apply_to_table`
    # That needs to resolve the relation and transform the column accordingly
    if table_name != main_table_name and "apply_to_table" not in source_field:
        raise ValueError(
            "Use apply_to_table for foreign fields: {}#{}".format(table_name, field)
        )

    table = tables[table_name]

    if "apply_to_column" in source_field:
        return table[field].apply(source_field["apply_to_column"])

    elif "apply_to_row" in source_field:
        return table.apply(source_field["apply_to_row"], axis=1)

    elif "apply_to_table" in source_field:
        if table_name == main_table_name:
            return source_field["apply_to_table"](table, field)
        else:
            # source field is in a related table
            main_table = tables[main_table_name]
            return source_field["apply_to_table"](main_table, table, field)

    elif "field" in source_field:
        return tables[table_name][field]

    else:
        raise ValueError("Unable to map: " + field + " in table: " + table_name)


def transform(
    mapping_field: str, main_table_name: str, tables: Dict[str, DataFrame]
) -> DataFrame:
    """
    Transforms the data in the source tables to it's import representation.
    It will loop over every field specified in the `MAPPING` and convert from
    the source field to the import field.
    """
    result = DataFrame(index=tables[main_table_name].index)

    for field_mapping in MAPPING:
        if (
            "sources" not in field_mapping
            or mapping_field not in field_mapping["sources"]
        ):
            # Not mapping this field
            continue

        import_field = field_mapping["field"]
        source_field = field_mapping["sources"][mapping_field]

        try:
            r = transform_field(source_field, main_table_name, tables)
            if r is None:
                continue
            result[import_field] = r
        except Exception as e:
            raise ValueError(
                "Error mapping to: " + import_field + " from: " + mapping_field
            ) from e
    return result


@handle_import_stage(ImportStage.transform)
def transform_source(source_type: str, source_data: Dict[str, DataFrame]) -> DataFrame:
    config = IMPORT_CONFIG[source_type]
    transformed = transform(config["mapping_field"], config["main_table"], source_data)

    # add common fields
    transformed["source"] = config["type"]
    transformed["hat_id"] = transformed.apply(hat_id, axis=1)
    transformed["document_id"] = transformed.apply(create_documentid, axis=1)

    return transformed
