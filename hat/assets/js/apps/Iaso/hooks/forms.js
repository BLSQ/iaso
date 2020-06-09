import { useCallback, useReducer } from 'react';

const SET_FIELD_VALUE = 'SET_FIELD_VALUE';
const SET_FIELD_ERRORS = 'SET_FIELD_ERRORS';

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
        default:
            return state;
    }
}

function formStateInitializer(initialValues) {
    return Object.entries(initialValues).reduce((accumulator, [name, value]) => ({
        ...accumulator,
        [name]: { value, errors: [] },
    }), {});
}

export function useFormState(initialValues) {
    const [formState, dispatch] = useReducer(formStateReducer, initialValues, formStateInitializer);

    const setFieldValue = useCallback((name, value) => {
        dispatch({ type: SET_FIELD_VALUE, payload: { name, value } });
    }, [dispatch]);
    const setFieldErrors = useCallback((name, errors) => {
        dispatch({ type: SET_FIELD_ERRORS, payload: { name, errors } });
    }, [dispatch]);

    return [formState, setFieldValue, setFieldErrors];
}
