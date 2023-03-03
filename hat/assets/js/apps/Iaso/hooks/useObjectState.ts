import { Dispatch, useReducer } from 'react';
import { cloneDeep } from 'lodash';

const dictReducer = (state, fieldDict) => {
    const copy = cloneDeep(state);
    Object.keys(fieldDict).forEach(key => {
        copy[key] = fieldDict[key];
    });
    return copy;
};

/** Use and modify an object (dictionnay) state in the same fashion as the class components of old:
 * Example:
 * const [state, setState] = useObjectState(initialState)
 * setState({name: "Bond"})
 * The `dictReducer` uses cloneDeep so it's safe to use with complex objects
 * You can't directly update nested values though:
 * setState({agent:{name:"Bond"}}) will override the whole value of state.agent with {name: "Bond"}
 */

export const useObjectState = (
    initialState: Record<string, any> = {},
): [any, Dispatch<any>] => {
    return useReducer(dictReducer, initialState);
};
