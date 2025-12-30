import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Optional } from 'bluesquare-components';

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
