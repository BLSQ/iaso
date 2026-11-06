import { FormikErrors, FormikHelpers } from 'formik';
import { get } from 'lodash';
import { DrfValidationErrors, isApiError400 } from 'Iaso/libs/Api';

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

const convertDrfErrorValue = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        if (value.every(item => typeof item === 'string')) {
            return value.join(' ');
        }

        return value.map(convertDrfErrorValue);
    }

    if (value && typeof value === 'object') {
        const entries = Object.entries(value);

        const nonFieldErrors = entries.find(
            ([key]) => key === 'non_field_errors',
        );

        if (nonFieldErrors) {
            const [, errors] = nonFieldErrors;

            if (Array.isArray(errors)) {
                return errors.join(' ');
            }
        }

        return Object.fromEntries(
            entries.map(([key, val]) => [key, convertDrfErrorValue(val)]),
        );
    }

    return value;
};

export const convertDrfErrorsToFormik = <T>(
    errors: DrfValidationErrors<T>,
    helpers: FormikHelpers<T>,
) => {
    const fieldErrors: FormikErrors<T> = {};

    Object.entries(errors).forEach(([key, value]) => {
        if (key === 'non_field_errors') {
            if (Array.isArray(value)) {
                helpers.setStatus(value.join(' '));
            }
            return;
        }

        fieldErrors[key as keyof T] = convertDrfErrorValue(value) as never;
    });

    helpers.setErrors(fieldErrors);
};

export const withFormikSubmitAsync =
    <TValues>(submit: (values: TValues) => Promise<unknown>) =>
    async (values: TValues, helpers: FormikHelpers<TValues>) => {
        try {
            await submit(values);
        } catch (error) {
            if (isApiError400<TValues>(error)) {
                convertDrfErrorsToFormik(error.details, helpers);

                return;
            }

            throw error;
        }
    };
