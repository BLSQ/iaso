import { Dispatch } from 'react';
import { useImmerReducer } from 'use-immer';

const recursiveCheck = (obj, fields): void => {
    Object.keys(fields).forEach(key => {
        if (!Array.isArray(fields[key]) && typeof fields[key] !== 'object') {
            if (typeof obj[key] === typeof fields[key]) {
                // Can be disabled because we're using Immer
                // eslint-disable-next-line no-param-reassign
                obj[key] = fields[key];
            } else {
                console.error(
                    `Updated value type doesn not match original type for ${key}: expected ${typeof obj[
                        key
                    ]}, got ${typeof fields[key]}`,
                );
            }
        } else {
            recursiveCheck(obj[key], fields[key]);
        }
    });
};

const recursiveReducer = (draft, fieldDict): void => {
    recursiveCheck(draft, fieldDict);
};

/** Use and modify an object (dictionnay) state in the same fashion as the class components of old:
 * Example:
 * const [state, setState] = useObjectState(initialState)
 * setState({name: "Bond"})
 * The `dictReducer` uses immer so it's safe to use with complex objects
 * You can update nested objects as well, but it's not type safe in the sens that you can add fields to the state
 * that didn't previously exist
 */

export const useObjectState = (
    initialState: Record<string, any> = {},
): [any, Dispatch<any>] => {
    return useImmerReducer(recursiveReducer, initialState);
};
