import { useMemo } from 'react';
import { useGetOrgUnitTypesDropdownOptions } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';

export const useProjectOrgUnitTypeIds = (
    projectId?: number | null,
): { orgUnitTypeIds?: number[]; isFetching: boolean } => {
    const { data, isFetching } = useGetOrgUnitTypesDropdownOptions({
        projectId: projectId ?? undefined,
        enabled: Boolean(projectId),
    });
    const orgUnitTypeIds = useMemo(
        () => data?.map(orgUnitType => orgUnitType.original.id),
        [data],
    );
    return { orgUnitTypeIds, isFetching };
};
