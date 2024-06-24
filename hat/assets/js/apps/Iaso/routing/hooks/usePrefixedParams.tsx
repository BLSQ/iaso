import { useMemo } from 'react';
import { extractPrefixedParams } from '../utils';

export const usePrefixedParams = (
    prefix: string | undefined,
    params: Record<string, string>,
): Record<string, string> => {
    return useMemo(() => {
        if (!prefix) {
            return params;
        }
        return extractPrefixedParams(prefix, params);
    }, [params, prefix]);
};
