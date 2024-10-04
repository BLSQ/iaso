import { useCallback, useReducer } from 'react';

const SET_FIELD_VALUE = 'SET_FIELD_VALUE';
const SET_FIELD_ERRORS = 'SET_FIELD_ERRORS';
const SET_FORM_STATE = 'SET_FORM_STATE';

function formStateReducer(state, action) {
    const { type, payload } = action;

    switch (type) {
        case SET_FIELD_VALUE:
            return {
                ...state,
                [payload.name]: { value: payload.value, errors: [] },
            };
        case SET_FIELD_ERRORS:
            return {
                ...state,
                [payload.name]: {
                    ...state[payload.name],
                    errors: payload.errors,
                },
            };
        case SET_FORM_STATE:
            return payload;
        default:
            return state;
    }
}

function formStateInitializer(initialValues) {
    return Object.entries(initialValues).reduce(
        (accumulator, [name, value]) => ({
            ...accumulator,
            [name]: { value, errors: [] },
        }),
        {},
    );
}

/**
 * Form state reducer.
 *
 * Usage:
 *
 * > const [formState, setFieldValue, setFieldErrors] = useFormState()
 * > <InputComponent
 * >   onChange={setFieldValue}
 * >   value={formState.name.value}
 * >   errors={formState.sub_unit_type_ids.errors}
 * >   ...
 * > />
 * @param initialValues
 * @returns [Object, func, func, func]
 */
export function useFormState(initialValues) {
    const [formState, dispatch] = useReducer(
        formStateReducer,
        initialValues,
        formStateInitializer,
    );

    const setFieldValue = useCallback(
        (name, value, transformer = null) => {
            const transformedValue =
                transformer === null ? value : transformer(value);
            dispatch({
                type: SET_FIELD_VALUE,
                payload: { name, value: transformedValue },
            });
        },
        [dispatch],
    );

    const setFormState = useCallback(
        newFormState => {
            dispatch({
                type: SET_FORM_STATE,
                payload: formStateInitializer(newFormState),
            });
        },
        [dispatch],
    );

    const setFieldErrors = useCallback(
        (name, errors) => {
            dispatch({ type: SET_FIELD_ERRORS, payload: { name, errors } });
        },
        [dispatch],
    );

    return [formState, setFieldValue, setFieldErrors, setFormState];
}

export const getValues = formState => {
    return Object.fromEntries(
        Object.entries(formState).map(([key, valueDict]) => [
            key,
            valueDict.value,
        ]),
    );
};

// IA-904 removing 'tab' key from the mapped values to avoid bug
export const getInstancesFilterValues = formState => {
    return Object.fromEntries(
        Object.entries(formState)
            // skipping tab, since it creates bugs
            // and shouldn't be managed by the filter anyway
            .filter(([key, _valueDict]) => key !== 'tab')
            .map(([key, valueDict]) => [key, valueDict.value]),
    );
};
