import {
    fetchOrgUnitsTypes,
    fetchSources,
    fetchAlgorithms,
    fetchAlgorithmRuns,
} from '../../utils/requests';
import { fetchUsersProfiles } from '../users/actions';

import { setOrgUnitTypes, setSources } from '../orgUnits/actions';

import { setAlgorithms, setAlgorithmRuns } from './actions';

import { useFetchOnMount } from '../../hooks/fetchOnMount';

export const useLinksFiltersData = (
    dispatch,
    setFetchingRuns,
    setFetchingOrgUnitTypes,
    setFetchingProfiles,
    setFetchingAlgorithms,
    setFetchingSource,
) => {
    useFetchOnMount([
        {
            fetch: fetchAlgorithms,
            setFetching: setFetchingAlgorithms,
            setData: setAlgorithms,
        },
        {
            fetch: fetchOrgUnitsTypes,
            setFetching: setFetchingOrgUnitTypes,
            setData: setOrgUnitTypes,
        },
        {
            fetch: () => dispatch(fetchUsersProfiles()),
            setFetching: setFetchingProfiles,
        },
        {
            fetch: fetchAlgorithmRuns,
            setFetching: setFetchingRuns,
            setData: setAlgorithmRuns,
            args: ['/api/algorithmsruns/'],
        },
        {
            fetch: fetchSources,
            setFetching: setFetchingSource,
            setData: setSources,
        },
    ]);
};
export const useRunsFiltersData = (
    dispatch,
    setFetchingProfiles,
    setFetchingSource,
    setFetchingAlgorithms,
) => {
    useFetchOnMount([
        {
            fetch: () => dispatch(fetchUsersProfiles()),
            setFetching: setFetchingProfiles,
        },
        {
            fetch: fetchSources,
            setFetching: setFetchingSource,
            setData: setSources,
        },
        {
            fetch: fetchAlgorithms,
            setFetching: setFetchingAlgorithms,
            setData: setAlgorithms,
        },
    ]);
};
