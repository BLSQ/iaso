import { sum } from 'lodash';
import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { LevelOrgUnitCounts, PlanningLevel } from './types';
import { getGroupIds } from './utils';

type SearchCountsResponse = {
    counts: { index: number; count: number }[];
};

type Params = {
    rootOrgUnitId?: number;
    level: PlanningLevel;
};

const toCountMap = (
    ids: number[],
    counts: SearchCountsResponse['counts'],
): Map<number, number> =>
    new Map(ids.map((id, index) => [id, counts[index]?.count ?? 0]));

// One request: the first search counts the whole level, the next ones count each selected group,
// then each selected type regardless of groups.
export const useGetLevelOrgUnitCounts = ({
    rootOrgUnitId,
    level,
}: Params): UseQueryResult<LevelOrgUnitCounts, Error> => {
    const { orgUnitTypeIds } = level;
    const groupIds = getGroupIds(level);
    // A single type without groups is counted by the whole level search.
    const countsTypesSeparately =
        orgUnitTypeIds.length > 1 || groupIds.length > 0;
    const baseSearch = {
        orgUnitParentId: rootOrgUnitId,
        orgUnitTypeId: orgUnitTypeIds.join(','),
        validation_status: 'VALID',
    };
    const searches = [
        { ...baseSearch, group: groupIds.join(',') || undefined },
        ...groupIds.map(groupId => ({ ...baseSearch, group: groupId })),
        ...(countsTypesSeparately
            ? orgUnitTypeIds.map(typeId => ({
                  ...baseSearch,
                  orgUnitTypeId: typeId,
              }))
            : []),
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
                    // Skips the instances count annotation, only the counts are used.
                    fields: 'id',
                    searches: JSON.stringify(searches),
                }),
            ),
        options: {
            enabled: Boolean(rootOrgUnitId) && orgUnitTypeIds.length > 0,
            keepPreviousData: true,
            select: ({ counts }: SearchCountsResponse) => {
                const [levelCount, ...otherCounts] = counts;
                const total = levelCount?.count ?? 0;
                const countByTypeId = countsTypesSeparately
                    ? toCountMap(
                          orgUnitTypeIds,
                          otherCounts.slice(groupIds.length),
                      )
                    : new Map([[orgUnitTypeIds[0], total]]);
                return {
                    total,
                    typesTotal: sum([...countByTypeId.values()]),
                    countByGroupId: toCountMap(
                        groupIds,
                        otherCounts.slice(0, groupIds.length),
                    ),
                    countByTypeId,
                };
            },
        },
    });
};
