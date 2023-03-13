import { Dispatch } from 'react';
import { useImmerReducer } from 'use-immer';

// TODO DO WE REALLY NEED THIS ONE?

export type ArrayUpdate<T> = {
    index: number;
    value: T;
};

export type FullArrayUpdate<T> = {
    index: 'all';
    value: T[];
};

const arrayReducer = <T>(
    draft: T[],
    value: ArrayUpdate<T> | FullArrayUpdate<T>,
) => {
    if (value.index === 'all') {
        if (Array.isArray(value.value)) {
            draft.splice(1, 0);
        }
        console.error(`expected value of type "Array", got ${value.value}`);
    } else {
        draft.splice(value.index, 1, value.value);
    }
};

/** Use and modify an array state :
 * Example:
 * const [state, setState] = useArrayState([0,1,2])
 * setState({index:1, value:3}) // new state value: [0,3,2]
 * The `dictReducer` uses cloneDeep so it's safe to use with arrays of objects
 * You can only update one element at a time
 * To replace the whole array, use {index: "all", value: <new array>}
 */

export const useArrayState = <T>(
    initialState: T[] = [],
): [any, Dispatch<any>] => {
    return useImmerReducer(arrayReducer, initialState);
};
