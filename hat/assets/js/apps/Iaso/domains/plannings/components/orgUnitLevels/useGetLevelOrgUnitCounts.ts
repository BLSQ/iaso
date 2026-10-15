import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { PlanningLevel } from './types';

type SearchCountsResponse = {
    counts: { index: number; count: number }[];
};

export type LevelOrgUnitCounts = {
    total: number;
    countByGroupId: Map<number, number>;
};

type Params = {
    rootOrgUnitId?: number;
    level: PlanningLevel;
};

// One request: the first search counts the whole level, the others count each selected group on its own.
export const useGetLevelOrgUnitCounts = ({
    rootOrgUnitId,
    level: { orgUnitTypeIds, groupIds },
}: Params): UseQueryResult<LevelOrgUnitCounts, Error> => {
    const baseSearch = {
        orgUnitParentId: rootOrgUnitId,
        orgUnitTypeId: orgUnitTypeIds.join(','),
        validation_status: 'VALID',
    };
    const searches = [
        { ...baseSearch, group: groupIds.join(',') || undefined },
        ...groupIds.map(groupId => ({ ...baseSearch, group: groupId })),
    ];
    return useSnackQuery({
        queryKey: [
            'planningLevelOrgUnitCounts',
            rootOrgUnitId,
            orgUnitTypeIds,
            groupIds,
        ],
        queryFn: () =>
            getRequest(
                makeUrlWithParams('/api/orgunits/', {
                    limit: 1,
                    smallSearch: true,
                    searches: JSON.stringify(searches),
                }),
            ),
        options: {
            enabled: Boolean(rootOrgUnitId) && orgUnitTypeIds.length > 0,
            keepPreviousData: true,
            select: ({ counts }: SearchCountsResponse) => ({
                total: counts[0]?.count ?? 0,
                countByGroupId: new Map(
                    groupIds.map((groupId, index) => [
                        groupId,
                        counts[index + 1]?.count ?? 0,
                    ]),
                ),
            }),
        },
    });
};
