import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Optional } from 'bluesquare-components';

/**
 * Convenience hook for when useState's initial value is fetched.
 * The state value stays undefined until `initialValue` has been fetched.
 * It is then set to the initial value and isSet is set to `true`.
 * isSet is useful when the state can be set to undefined a posteriori. It avoids conmplex gymnastics with useEffect and such
 *
 * @param initialState - A value that is fetched and starts undefined
 * @returns [state, setState, isSet] - traditional useState values + a boolean indication whether the initialState has already been set.
 */
export const useAsyncInitialState = <T>(
    initialState: Optional<T>,
): [
    T | undefined,
    React.Dispatch<React.SetStateAction<T | undefined>>,
    boolean,
] => {
    const [state, setState] = useState<T | undefined>();
    const isSet = useRef(false);

    useEffect(() => {
        if (initialState && !isSet.current) {
            setState(initialState);
            isSet.current = true;
        }
    }, [initialState]);
    return useMemo(
        () => [state, setState, isSet.current],
        [state, setState, isSet.current],
    );
};
