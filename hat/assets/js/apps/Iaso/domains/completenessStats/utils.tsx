import { useCallback } from 'react';
import { useGenUrl } from '../../routing/routing';

// eslint-disable-next-line no-unused-vars
type GetParentPageUrl = (parentOrgUnitId?: number | string) => string;

export const useGetParentPageUrl = (): GetParentPageUrl => {
    const genUrl = useGenUrl();
    return useCallback(
        (parentOrgUnitId?: number | string): string => {
            return genUrl({
                parentId: parentOrgUnitId ? `${parentOrgUnitId}` : undefined,
                page: null,
            });
        },
        [genUrl],
    );
};
