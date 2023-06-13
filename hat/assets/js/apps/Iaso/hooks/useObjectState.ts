import { Dispatch, useReducer } from 'react';
import { isEqual } from 'lodash';

const recursiveCheck = (state, fields): Record<string, any> => {
    if (isEqual(fields, {})) {
        // Can be disabled because we're using Immer
        // eslint-disable-next-line no-param-reassign
        return fields;
    }
    const copy = { ...state };
    Object.keys(fields).forEach(key => {
        if (!Array.isArray(fields[key]) && typeof fields[key] !== 'object') {
            if (
                typeof state[key] === typeof fields[key] ||
                state[key] === undefined ||
                // fields[key] should be allowed to be undefined otherwise we can never reset state values
                fields[key] === undefined
            ) {
                copy[key] = fields[key];
            } else {
                console.error(
                    `Updated value type does not match original type for ${key}: expected ${typeof state[
                        key
                    ]}, got ${typeof fields[key]}`,
                );
            }
        } else if (state[key] === undefined) {
            copy[key] = fields[key];
        } else {
            copy[key] = recursiveCheck(state[key], fields[key]);
        }
    });
    return copy;
};

export const recursiveReducer = (state, fieldDict): Record<string, any> => {
    return recursiveCheck(state, fieldDict);
};

/** Use and modify an object (dictionnay) state in the same fashion as the class components of old:
 * Example:
 * const [state, setState] = useObjectState(initialState)
 * setState({name: "Bond"})
 * You can update nested objects as well, but it's not type safe in the sens that you can add fields to the state
 * that didn't previously exist
 */

export const useObjectState = (
    initialState: Record<string, any> = {},
): [any, Dispatch<any>] => {
    return useReducer(recursiveReducer, initialState);
};
