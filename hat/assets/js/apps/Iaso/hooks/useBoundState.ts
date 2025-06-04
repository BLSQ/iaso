import isEqual from 'lodash/isEqual';
import { useEffect, useState } from 'react';
// TODO: maybe put this one outside of the domain to use it somewhere else

export const useBoundState = <T extends unknown>(
    initialValue: T,
    boundValue: T,
): [T, (newValue: T) => void] => {
    const [value, setValue] = useState<T>(initialValue);

    useEffect(() => {
        if (!isEqual(value, boundValue)) {
            setValue(boundValue);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [boundValue]);
    return [value, setValue];
};
