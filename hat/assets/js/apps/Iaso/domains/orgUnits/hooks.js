import omit from 'lodash/omit';
import { useDispatch } from 'react-redux';

import { useSnackQuery, useSnackMutation } from 'Iaso/libs/apiHooks';
import { getRequest, patchRequest, postRequest } from 'Iaso/libs/Api';

import { redirectToReplace } from '../../routing/actions';
import { fetchOrgUnitsTypes, fetchGroups } from '../../utils/requests';
import { setOrgUnitTypes, setGroups } from './actions';
import { useFetchOnMount } from '../../hooks/fetchOnMount';
import MESSAGES from './messages';
import { getOtChipColors, getChipColors } from '../../constants/chipColors';
import { baseUrls } from '../../constants/urls';

const baseUrl = baseUrls.orgUnitDetails;

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
    const { data: algorithms = [], isFetching: isFetchingAlgorithm } =
        useSnackQuery(
            ['algorithms'],
            () => getRequest('/api/algorithms/'),
            MESSAGES.fetchAlgorithmsError,
        );
    const { data: algorithmRuns = [], isFetching: isFetchingAlgorithmRuns } =
        useSnackQuery(
            ['algorithmRuns'],
            () => getRequest('/api/algorithmsruns/'),
            MESSAGES.fetchAlgorithmsError,
        );
    const { data: groups = [], isFetching: isFetchingGroups } = useSnackQuery(
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
    const { data: profiles = [], isFetching: isFetchingProfiles } =
        useSnackQuery(
            ['profiles'],
            () => getRequest('/api/profiles/'),
            MESSAGES.fetchProfilesError,
            {
                select: data => data.profiles,
            },
        );
    const { data: orgUnitTypes = [], isFetching: isFetchingOrgUnitTypes } =
        useSnackQuery(
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

    const { data: links = [], isFetching: isFetchingLinks } = useSnackQuery(
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

    const { data: sources = [], isFetching: isFetchingPlainSources } =
        useSnackQuery(
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

    const isFetchingSources = isNewOrgunit
        ? isFetchingPlainSources
        : isFetchingAssociatedDataSources;

    const { data: originalOrgUnit, isFetching: isFetchingDetail } =
        useSnackQuery(
            ['currentOrgUnit'],
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

export const useSaveOrgUnit = () =>
    useSnackMutation(
        body =>
            body.id
                ? patchRequest(`/api/orgunits/${body.id}/`, body)
                : postRequest('/api/orgunits/create_org_unit/', body),
        MESSAGES.saveOrgUnitSuccesfull,
        MESSAGES.saveOrgUnitError,
        ['currentOrgUnit'],
    );
