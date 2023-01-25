import { get } from 'lodash';

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

export const convertFormStateToDict = formState => {
    const result = {};
    const fields = Object.keys(formState);
    fields.forEach(field => {
        result[field] = formState[field].value;
    });
    return result;
};

export const isFieldValid = (keyValue, value, requiredFields) => {
    const field = requiredFields.find(f => f.key === keyValue);
    if (field) {
        switch (field.type) {
            case 'string': {
                if (value === '') {
                    return false;
                }
                return true;
            }
            case 'array': {
                if (!value || value.length === 0) {
                    return false;
                }
                return true;
            }
            case 'boolean': {
                if (value === null) {
                    return false;
                }
                return true;
            }

            default:
                return true;
        }
    }
    return true;
};

export const isFormValid = (requiredFields, currentForm) => {
    return !requiredFields.find(
        field =>
            !isFieldValid(
                field.key,
                currentForm[field.key].value,
                requiredFields,
            ),
    );
};

export const hasFormikFieldError = (key, errors, touched) => {
    if (!errors) return false;
    return Boolean(get(errors, key) && get(touched, key));
};
