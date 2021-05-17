import { useRef, useEffect } from 'react';

/**
 * use timeout in hooks to simulate async API calls
 * @see https://overreacted.io/making-setinterval-declarative-with-react-hooks/
 * @see https://gist.github.com/Danziger/336e75b6675223ad805a88c2dfdcfd4a
 * @param {function} callback
 * @param {number} delay
 */

export const useTimeout = (callback, delay) => {
    const callbackRef = useRef();

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const execute = () => {
            callbackRef.current();
        };
        setTimeout(execute, delay);
        return () => clearTimeout(execute);
    }, [delay]);
};
