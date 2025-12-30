import { useEffect, useRef } from 'react';
import { Optional } from 'bluesquare-components';

// Needs to be passed a useCallback, so we can have a static deps array for the internal useEffect
export const useSkipEffectUntilValue = (
    value: Optional<any>,
    callback: () => void,
): void => {
    const watcher = useRef(undefined);

    useEffect(() => {
        if (value && !watcher.current) {
            watcher.current = value;
        }
        if (value !== watcher.current) {
            callback();
        }
    }, [callback, value]);
};
