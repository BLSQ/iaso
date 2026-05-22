import { useEffect, useRef } from 'react';
import { Optional } from 'bluesquare-components';

/**
 *
 * Convenience hook to trigger a side effect that depends on a fetched value and shouldn't trigger until the value has been fetched.
 * The callback should be wrapped in useCallback before being passed so we can have a static deps array for the hook's internal useEffect
 *
 * @param value
 * @param callback : a callback function. IMPORTANT: needs to be wrapped in useCallback before being passed.
 */

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
