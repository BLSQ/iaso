import { Router } from '../../types/general';
import { genUrl } from '../../routing/routing';

export const usetGetParentPageUrl = (router: Router) => {
    return (parentOrgUnitId?: number | string): string =>
        genUrl(router, {
            parentId: parentOrgUnitId ? `${parentOrgUnitId}` : undefined,
            page: null,
        });
};
