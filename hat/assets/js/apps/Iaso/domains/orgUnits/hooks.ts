import { useCallback, useMemo } from 'react';
import { useQueryClient } from 'react-query';
import { getRequest, patchRequest, postRequest } from 'Iaso/libs/Api';
import {
    useSnackMutation,
    useSnackQueries,
    useSnackQuery,
} from 'Iaso/libs/apiHooks';
import { getChipColors, getOtChipColors } from '../../constants/chipColors';
import { useCheckUserHasWriteTypePermission } from '../../utils/usersUtils';
import { DataSource } from '../dataSources/types/dataSources';
import { Link, PaginatedLinks } from '../links/types';
import {
    GroupDropdownOption,
    OrgUnitTypeDropdownOption,
} from './configuration/types';
import MESSAGES from './messages';
import { PaginatedDataSources } from './types/dataSources';
import { OrgUnit } from './types/orgUnit';
import { PaginatedOrgUnitTypes } from './types/orgunitTypes';

type UseOrgUnitDetailDataReturn = {
    groups: GroupDropdownOption[];
    orgUnitTypes: OrgUnitTypeDropdownOption[];
    links: Link[];
    isFetchingDatas: boolean;
    sources: DataSource[];
    originalOrgUnit: OrgUnit | undefined;
    isFetchingDetail: boolean;
    isFetchingOrgUnitTypes: boolean;
    isFetchingGroups: boolean;
    isFetchingSources: boolean;
    parentOrgUnit: OrgUnit | undefined;
};

export const useOrgUnitDetailData = (
    isNewOrgunit: boolean,
    orgUnitId: string,
    setCurrentOrgUnit: (orgUnit: OrgUnit) => void,
    levels: string,
    tab: string,
): UseOrgUnitDetailDataReturn => {
    const { data: originalOrgUnit, isFetching: isFetchingDetail } =
        useSnackQuery(
            ['currentOrgUnit', orgUnitId],
            () => getRequest(`/api/orgunits/${orgUnitId}/`),
            MESSAGES.fetchOrgUnitError,
            {
                enabled: !isNewOrgunit,
                onSuccess: ou => setCurrentOrgUnit(ou),
            },
        );
    let groupsDataSourceQueryParams;
    if (originalOrgUnit?.version_id) {
        groupsDataSourceQueryParams = `?version=${originalOrgUnit.version_id}`;
    } else if (originalOrgUnit?.source_id) {
        groupsDataSourceQueryParams = `?dataSource=${originalOrgUnit.source_id}`;
    } else {
        groupsDataSourceQueryParams = undefined;
    }
    const groupsQueryParams = isNewOrgunit
        ? '?defaultVersion=true'
        : groupsDataSourceQueryParams;
    const groupsApiUrl = '/api/groups/dropdown/';

    const cacheOptions = {
        staleTime: 1000 * 60 * 15, // in MS
        cacheTime: 1000 * 60 * 5,
    };
    const checkUserHasWriteTypePermission =
        useCheckUserHasWriteTypePermission();
    // Filter org unit types based on user permissions and editable types
    // Include types the user can edit, plus the current org unit's type
    const onSelectOrgUnitTypes = useCallback(
        (data: PaginatedOrgUnitTypes): OrgUnitTypeDropdownOption[] => {
            const orgUnitTypes =
                data?.orgUnitTypes.map((ot, i) => ({
                    ...ot,
                    color: getOtChipColors(i),
                })) || [];
            return orgUnitTypes.filter(
                ot =>
                    checkUserHasWriteTypePermission(ot.id) ||
                    originalOrgUnit?.org_unit_type?.id === ot.id,
            );
        },
        [checkUserHasWriteTypePermission, originalOrgUnit?.org_unit_type?.id],
    );
    const [
        { data: groups = [], isFetching: isFetchingGroups },
        { data: orgUnitTypes = [], isFetching: isFetchingOrgUnitTypes },
        { data: links = [], isFetching: isFetchingLinks },
        {
            data: associatedDataSources = [],
            isFetching: isFetchingAssociatedDataSources,
        },
        { data: sources = [], isFetching: isFetchingPlainSources },
        { data: parentOrgUnit },
    ] = useSnackQueries<
        [
            GroupDropdownOption[],
            OrgUnitTypeDropdownOption[],
            Link[],
            DataSource[],
            DataSource[],
            OrgUnit | undefined,
        ]
    >([
        {
            queryKey: ['groups', groupsQueryParams],
            queryFn: () => getRequest(`${groupsApiUrl}${groupsQueryParams}`),
            snackErrorMsg: MESSAGES.fetchGroupsError,
            options: {
                select: (data: GroupDropdownOption[]) =>
                    data.map(group => ({
                        value: group.id,
                        label: group.label,
                    })),
                enabled:
                    (tab === 'children' || tab === 'infos') &&
                    (Boolean(originalOrgUnit) || isNewOrgunit),
                ...cacheOptions,
            },
        },
        {
            queryKey: ['orgUnitTypes'],
            queryFn: () => getRequest('/api/v2/orgunittypes/'),
            snackErrorMsg: MESSAGES.fetchOrgUnitTypesError,
            options: {
                select: onSelectOrgUnitTypes,
                enabled: tab === 'map' || tab === 'children' || tab === 'infos',
                ...cacheOptions,
            },
        },
        {
            queryKey: ['links'],
            queryFn: () => getRequest(`/api/links/?orgUnitId=${orgUnitId}`),
            snackErrorMsg: MESSAGES.fetchLinksError,
            options: {
                select: (data: PaginatedLinks) => data.links,
                enabled: !isNewOrgunit,
            },
        },
        {
            queryKey: ['associatedDataSources'],
            queryFn: () =>
                getRequest(`/api/datasources/?linkedTo=${orgUnitId}`),
            snackErrorMsg: MESSAGES.fetchSourcesError,
            options: {
                select: (data: PaginatedDataSources) =>
                    data.sources.map((s, i) => ({
                        ...s,
                        color: getChipColors(i),
                    })),
                enabled: !isNewOrgunit && (tab === 'map' || tab === 'links'),
                ...cacheOptions,
            },
        },
        {
            queryKey: ['associatedDataSources'],
            queryFn: () => getRequest('/api/datasources/'),
            snackErrorMsg: MESSAGES.fetchSourcesError,
            options: {
                select: (data: PaginatedDataSources) =>
                    data.sources.map((s, i) => ({
                        ...s,
                        color: getChipColors(i),
                    })),
                enabled: isNewOrgunit && (tab === 'map' || tab === 'links'),
                ...cacheOptions,
            },
        },
        {
            queryKey: ['parentOrgUnit', orgUnitId],
            queryFn: () => getRequest(`/api/orgunits/${levels}/`),
            snackErrorMsg: MESSAGES.fetchOrgUnitError,
            options: {
                select: (data: OrgUnit) => data,
                enabled:
                    Boolean(levels) &&
                    isNewOrgunit &&
                    levels.split(',').length === 1,
                ...cacheOptions,
            },
        },
    ]);

    const isFetchingSources = isNewOrgunit
        ? isFetchingPlainSources
        : isFetchingAssociatedDataSources;

    return {
        groups,
        orgUnitTypes,
        links,
        isFetchingDatas:
            isFetchingGroups ||
            isFetchingSources ||
            isFetchingLinks ||
            isFetchingOrgUnitTypes,
        sources: isNewOrgunit ? sources : associatedDataSources,
        originalOrgUnit,
        isFetchingDetail,
        isFetchingOrgUnitTypes,
        isFetchingGroups,
        isFetchingSources,
        parentOrgUnit,
    };
};

export type SaveOrgUnitPayload = Omit<Partial<OrgUnit>, 'groups'> & {
    groups: number[];
};

export const useSaveOrgUnit = (
    onSuccess?: () => void,
    invalidateQueryKey?: string[],
) => {
    return useSnackMutation<OrgUnit, unknown, SaveOrgUnitPayload, unknown>(
        body =>
            body.id
                ? patchRequest(`/api/orgunits/${body.id}/`, body)
                : postRequest('/api/orgunits/create_org_unit/', body),
        MESSAGES.saveOrgUnitSuccesfull,
        MESSAGES.saveOrgUnitError,
        invalidateQueryKey,
        { onSuccess },
    );
};

export const useRefreshOrgUnit = () => {
    const queryClient = useQueryClient();
    return data => queryClient.setQueryData(['forms', data.id], data);
};

export const useOrgUnitTabParams = (params, paramsPrefix) => {
    return useMemo(() => {
        const { orgUnitId, tab, ...rest } = params;
        const tabParams = { orgUnitId, tab };
        const formKeys = Object.keys(rest).filter(k =>
            k.includes(paramsPrefix),
        );
        formKeys.forEach(formKey => {
            tabParams[formKey] = rest[formKey];
        });
        return tabParams;
    }, [params, paramsPrefix]);
};
