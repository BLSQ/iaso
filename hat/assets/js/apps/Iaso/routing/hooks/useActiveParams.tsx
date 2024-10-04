import { useMemo } from 'react';
import { ParamsWithAccountId } from './useParamsObject';

/**
 * Convenience hook to remove `accountId` from the params so they can be passed
 * to an API hook without sending a useless query param to the backend, or passed as props
 * to a component.
 *
 */
export const useActiveParams = (
    params: ParamsWithAccountId,
): Record<string, string> => {
    return useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
        const { accountId, ...paramsToUse } = params;
        return paramsToUse;
    }, [params]);
};
