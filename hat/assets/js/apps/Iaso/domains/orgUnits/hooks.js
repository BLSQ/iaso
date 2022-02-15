import { useEffect } from 'react';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { getRequest } from 'Iaso/libs/Api';
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

export const useOrgUnitDetailData = (isNewOrgunit, orgUnitId) => {
    const { data: algorithms = [] } = useSnackQuery(
        ['algorithms'],
        () => getRequest('/api/algorithms/'),
        MESSAGES.fetchAlgorithmsError,
    );
    const { data: algorithmRuns = [] } = useSnackQuery(
        ['algorithmRuns'],
        () => getRequest('/api/algorithmsruns/'),
        MESSAGES.fetchAlgorithmsError,
    );
    const { data: groups = [] } = useSnackQuery(
        ['groups'],
        () =>
            getRequest(
                `/api/groups/${isNewOrgunit ? '?&defaultVersion=true' : ''}`,
            ),
        MESSAGES.fetchGroupsError,
        {
            select: data => data.groups,
        },
    );
    const { data: profiles = [] } = useSnackQuery(
        ['profiles'],
        () => getRequest('/api/profiles/'),
        MESSAGES.fetchProfilesError,
        {
            select: data => data.profiles,
        },
    );
    const { data: orgUnitTypes = [] } = useSnackQuery(
        ['orgUnitTypes'],
        () => getRequest('/api/orgunittypes/'),
        MESSAGES.fetchOrgUnitTypesError,
        {
            select: data =>
                data.orgUnitTypes.map((ot, i) => ({
                    ...ot,
                    color: getOtChipColors(i),
                })),
        },
    );

    const { data: links = [] } = useSnackQuery(
        ['links'],
        () => getRequest(`/api/links/?orgUnitId=${orgUnitId}`),
        MESSAGES.fetchLinksError,
        {
            select: data => data.links,
            enabled: !isNewOrgunit,
        },
    );
    const {
        data: associatedDataSources = [],
        isFetching: isFetchingAssociatedDataSources,
    } = useSnackQuery(
        ['associatedDataSources'],
        () => getRequest(`/api/datasources/?linkedTo=${orgUnitId}`),
        MESSAGES.fetchSourcesError,
        {
            select: data =>
                data.sources.map((s, i) => ({
                    ...s,
                    color: getChipColors(i),
                })),
            enabled: !isNewOrgunit,
        },
    );

    const { data: sources = [], isFetching: isFetchingSources } = useSnackQuery(
        ['associatedDataSources'],
        () => getRequest('/api/datasources/'),
        MESSAGES.fetchSourcesError,
        {
            select: data =>
                data.sources.map((s, i) => ({
                    ...s,
                    color: getChipColors(i),
                })),
            enabled: isNewOrgunit,
        },
    );

    useEffect(() => {}, []);
    return {
        algorithms,
        algorithmRuns,
        groups,
        profiles,
        orgUnitTypes,
        links,
        sources: isNewOrgunit ? sources : associatedDataSources,
        isFetchingSources: isNewOrgunit
            ? isFetchingSources
            : isFetchingAssociatedDataSources,
    };
};
