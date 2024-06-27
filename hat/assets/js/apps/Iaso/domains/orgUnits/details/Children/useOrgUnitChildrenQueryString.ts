import { OU_CHILDREN_PREFIX } from '../../../../constants/urls';
import { useApiParams } from '../../../../hooks/useApiParams';
import { usePrefixedParams } from '../../../../routing/hooks/usePrefixedParams';
import { tableDefaults } from '../../hooks/requests/useGetOrgUnitChildren';

export const useOrgUnitChildrenQueryString = params => {
    const strippedParams = usePrefixedParams(OU_CHILDREN_PREFIX, params);
    const { orgUnitId, ...tempParams } = strippedParams;
    if (tempParams.onlyDirectChildren === 'false') {
        tempParams.orgUnitParentId = orgUnitId;
    } else {
        tempParams.parent_id = orgUnitId;
    }
    delete tempParams.tab;

    const apiParams = useApiParams(tempParams, tableDefaults);
    return new URLSearchParams(apiParams).toString();
};
