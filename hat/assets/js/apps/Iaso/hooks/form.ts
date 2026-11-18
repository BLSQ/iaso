import { useCallback, useReducer } from 'react';

const SET_FIELD_VALUE = 'SET_FIELD_VALUE';
const SET_FIELD_ERRORS = 'SET_FIELD_ERRORS';
const SET_FORM_STATE = 'SET_FORM_STATE';

export type FormFieldState = {
    value: any;
    errors: any[];
};

export type FormState = Record<string, FormFieldState>;

type FormAction =
    | {
          type: typeof SET_FIELD_VALUE;
          payload: { name: string; value: any };
      }
    | {
          type: typeof SET_FIELD_ERRORS;
          payload: { name: string; errors: any };
      }
    | {
          type: typeof SET_FORM_STATE;
          payload: FormState;
      };

const formStateReducer = (state: FormState, action: FormAction): FormState => {
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
};

const formStateInitializer = (
    initialValues: Record<string, any>,
): FormState => {
    return Object.entries(initialValues).reduce(
        (accumulator, [name, value]) => ({
            ...accumulator,
            [name]: { value, errors: [] },
        }),
        {} as FormState,
    );
};

/**
 * Form state reducer.
 *
 * @deprecated Use Formik instead.
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
export const useFormState = (initialValues: Record<string, any>) => {
    const [formState, dispatch] = useReducer(
        formStateReducer,
        initialValues,
        formStateInitializer,
    );

    const setFieldValue = useCallback(
        (
            name: string,
            value: any,
            transformer: ((currentValue: any) => any) | null = null,
        ) => {
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
        (newFormState: Record<string, any>) => {
            dispatch({
                type: SET_FORM_STATE,
                payload: formStateInitializer(newFormState),
            });
        },
        [dispatch],
    );

    const setFieldErrors = useCallback(
        (name: string, errors: any) => {
            dispatch({ type: SET_FIELD_ERRORS, payload: { name, errors } });
        },
        [dispatch],
    );

    // State stays `any` so existing callers keep the same contract as the JS hook.
    return [formState, setFieldValue, setFieldErrors, setFormState] as [
        any,
        typeof setFieldValue,
        typeof setFieldErrors,
        typeof setFormState,
    ];
};

/** @deprecated Use Formik instead. */
export const getValues = (formState: FormState) => {
    return Object.fromEntries(
        Object.entries(formState).map(([key, valueDict]) => [
            key,
            valueDict.value,
        ]),
    );
};

/** @deprecated Use Formik instead. */
// IA-904 removing 'tab' key from the mapped values to avoid bug
export const getInstancesFilterValues = (formState: FormState) => {
    return Object.fromEntries(
        Object.entries(formState)
            // skipping tab, since it creates bugs
            // and shouldn't be managed by the filter anyway
            .filter(([key, _valueDict]) => key !== 'tab')
            .map(([key, valueDict]) => [key, valueDict.value]),
    );
};
