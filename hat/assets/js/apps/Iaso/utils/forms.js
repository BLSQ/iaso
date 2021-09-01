/**
 * Convert a comma-separated list of ids to an array of ids
 * This is a workaround to map the comma-separated string used by InputComponent with type=select
 * to an array of values
 * TODO: select input component should return a list of values of the same type as the provided values
 *
 * @param string
 * @returns {*}
 */
export function commaSeparatedIdsToArray(string) {
    if (!string) return [];
    return string
        .split(',')
        .filter(s => s !== '')
        .map(Number);
}

export function commaSeparatedIdsToStringArray(string) {
    if (!string) return [];
    return string
        .split(',')
        .filter(s => s !== '')
        .sort();
}
