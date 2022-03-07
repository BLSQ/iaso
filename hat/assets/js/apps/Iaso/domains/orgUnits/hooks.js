import {
    useSnackQuery,
    useSnackMutation,
    useSnackQueries,
} from 'Iaso/libs/apiHooks';
import { getRequest, patchRequest, postRequest } from 'Iaso/libs/Api';
import { useQueryClient } from 'react-query';

import { fetchOrgUnitsTypes, fetchGroups } from '../../utils/requests';
import { setOrgUnitTypes, setGroups } from './actions';
import { useFetchOnMount } from '../../hooks/fetchOnMount';
import MESSAGES from './messages';
import { getOtChipColors, getChipColors } from '../../constants/chipColors';

export const useOrgUnitsFiltersData = (
    dispatch,
    setFetchingOrgUnitTypes,
    setFetchingGroups,
) => {
    useFetchOnMount([
        {
            fetch: fetchOrgUnitsTypes,
            setFetching: fetching =>
                dispatch(setFetchingOrgUnitTypes(fetching)),
            setData: setOrgUnitTypes,
        },
        {
            fetch: fetchGroups,
            setFetching: setFetchingGroups,
            setData: setGroups,
        },
    ]);
};

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

export const useSaveOrgUnit = onSuccess =>
    useSnackMutation(
        body =>
            body.id
                ? patchRequest(`/api/orgunits/${body.id}/`, body)
                : postRequest('/api/orgunits/create_org_unit/', body),
        MESSAGES.saveOrgUnitSuccesfull,
        MESSAGES.saveOrgUnitError,
        undefined,
        { onSuccess },
    );

export const useRefreshOrgUnit = () => {
    const queryClient = useQueryClient();
    return data => queryClient.setQueryData(['forms', data.id], data);
};
