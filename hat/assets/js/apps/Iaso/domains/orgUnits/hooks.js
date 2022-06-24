import { useState, useEffect } from 'react';
import {
    useSnackQuery,
    useSnackMutation,
    useSnackQueries,
} from 'Iaso/libs/apiHooks.ts';
import { getRequest, patchRequest, postRequest } from 'Iaso/libs/Api';
import { useQuery, useQueryClient } from 'react-query';
import MESSAGES from './messages';
import { getOtChipColors, getChipColors } from '../../constants/chipColors';
import { fetchOrgUnitsTypes } from '../../utils/requests';
import { setOrgUnitTypes } from './actions';
import { useFetchOnMount } from '../../hooks/fetchOnMount';

export const useOrgUnitDetailData = (
    isNewOrgunit,
    orgUnitId,
    setCurrentOrgUnit,
) => {
    const [
        { data: algorithms = [], isFetching: isFetchingAlgorithm },
        { data: algorithmRuns = [], isFetching: isFetchingAlgorithmRuns },
        { data: groups = [], isFetching: isFetchingGroups },
        { data: profiles = [], isFetching: isFetchingProfiles },
        { data: orgUnitTypes = [], isFetching: isFetchingOrgUnitTypes },
        { data: links = [], isFetching: isFetchingLinks },
        {
            data: associatedDataSources = [],
            isFetching: isFetchingAssociatedDataSources,
        },
        { data: sources = [], isFetching: isFetchingPlainSources },
    ] = useSnackQueries([
        {
            queryKey: ['algorithms'],
            queryFn: () => getRequest('/api/algorithms/'),
        },
        {
            queryKey: ['algorithmRuns'],
            queryFn: () => getRequest('/api/algorithmsruns/'),
            snackErrorMsg: MESSAGES.fetchAlgorithmsError,
            options: {},
        },
        {
            queryKey: ['groups'],
            queryFn: () =>
                getRequest(
                    `/api/groups/${
                        isNewOrgunit ? '?&defaultVersion=true' : ''
                    }`,
                ),
            snackErrorMsg: MESSAGES.fetchGroupsError,
            options: {
                select: data => data.groups,
            },
        },
        {
            queryKey: ['profiles'],
            queryFn: () => getRequest('/api/profiles/'),
            snackErrorMsg: MESSAGES.fetchProfilesError,
            options: {
                select: data => data.profiles,
            },
        },
        {
            queryKey: ['orgUnitTypes'],
            queryFn: () => getRequest('/api/orgunittypes/'),
            snackErrorMsg: MESSAGES.fetchOrgUnitTypesError,
            options: {
                select: data =>
                    data.orgUnitTypes.map((ot, i) => ({
                        ...ot,
                        color: getOtChipColors(i),
                    })),
            },
        },
        {
            queryKey: ['links'],
            queryFn: () => getRequest(`/api/links/?orgUnitId=${orgUnitId}`),
            snackErrorMsg: MESSAGES.fetchLinksError,
            options: {
                select: data => data.links,
                enabled: !isNewOrgunit,
            },
        },
        {
            queryKey: ['associatedDataSources'],
            queryFn: () =>
                getRequest(`/api/datasources/?linkedTo=${orgUnitId}`),
            snackErrorMsg: MESSAGES.fetchSourcesError,
            options: {
                select: data =>
                    data.sources.map((s, i) => ({
                        ...s,
                        color: getChipColors(i),
                    })),
                enabled: !isNewOrgunit,
            },
        },
        // FIXME this can probably be refactored into a single query
        {
            queryKey: ['associatedDataSources'],
            queryFn: () => getRequest('/api/datasources/'),
            snackErrorMsg: MESSAGES.fetchSourcesError,
            options: {
                select: data =>
                    data.sources.map((s, i) => ({
                        ...s,
                        color: getChipColors(i),
                    })),
                // here seems to be an error here as the condition for enabling is the same as the query above
                enabled: !isNewOrgunit,
            },
        },
    ]);

    const isFetchingSources = isNewOrgunit
        ? isFetchingPlainSources
        : isFetchingAssociatedDataSources;

    const { data: originalOrgUnit, isFetching: isFetchingDetail } =
        useSnackQuery(
            ['currentOrgUnit', orgUnitId],
            () => getRequest(`/api/orgunits/${orgUnitId}/`),
            MESSAGES.fetchOrgUnitError,
            {
                enabled:
                    !isNewOrgunit && !isFetchingSources && !isFetchingLinks,
                onSuccess: ou => setCurrentOrgUnit(ou),
            },
        );

    return {
        algorithms,
        algorithmRuns,
        groups,
        profiles,
        orgUnitTypes,
        links,
        isFetchingDatas:
            isFetchingAlgorithm ||
            isFetchingProfiles ||
            isFetchingAlgorithmRuns ||
            isFetchingGroups ||
            isFetchingSources ||
            isFetchingLinks ||
            isFetchingOrgUnitTypes,
        sources: isNewOrgunit ? sources : associatedDataSources,
        originalOrgUnit,
        isFetchingDetail,
    };
};

export const useSaveOrgUnit = (onSuccess, invalidateQueryKey = undefined) =>
    useSnackMutation(
        body =>
            body.id
                ? patchRequest(`/api/orgunits/${body.id}/`, body)
                : postRequest('/api/orgunits/create_org_unit/', body),
        MESSAGES.saveOrgUnitSuccesfull,
        MESSAGES.saveOrgUnitError,
        invalidateQueryKey,
        { onSuccess },
    );

const makeGroupsQueryParams = ({ dataSourceId, sourceVersionId }) => {
    if (sourceVersionId) return `?version=${sourceVersionId}`;
    if (dataSourceId) return `?dataSource=${dataSourceId}`;
    return '?defaultVersion=true';
};
const getOrgUnitTypes = () => getRequest(`/api/orgunittypes/`);

export const useGetGroups = ({ dataSourceId, sourceVersionId }) => {
    const [enabled, setEnabled] = useState(false);
    const groupsQueryParams = makeGroupsQueryParams({
        dataSourceId,
        sourceVersionId,
    });

    useEffect(() => {
        if (dataSourceId) setEnabled(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataSourceId]);

    const { data: groups, isFetching: isFetchingGroups } = useSnackQuery(
        ['groups', dataSourceId, groupsQueryParams],
        () => getRequest(`/api/groups/${groupsQueryParams}`),
        MESSAGES.fetchGroupsError,
        {
            enabled,
            select: data => data?.groups,
        },
    );

    return {
        groups,
        isFetchingGroups,
    };
};

export const useRefreshOrgUnit = () => {
    const queryClient = useQueryClient();
    return data => queryClient.setQueryData(['forms', data.id], data);
};

export const useGetOrgUnitTypes = () => {
    return useQuery(['orgUnitTypes'], getOrgUnitTypes, {
        select: data => data.orgUnitTypes,
    });
};

export const useOrgUnitsFiltersData = (dispatch, setFetchingOrgUnitTypes) => {
    useFetchOnMount([
        {
            fetch: fetchOrgUnitsTypes,
            setFetching: fetching =>
                dispatch(setFetchingOrgUnitTypes(fetching)),
            setData: setOrgUnitTypes,
        },
    ]);
};
