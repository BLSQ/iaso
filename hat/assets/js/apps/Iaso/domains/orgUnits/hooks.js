import { fetchOrgUnitsTypes, fetchGroups } from '../../utils/requests';
import { setOrgUnitTypes, setGroups } from './actions';
import { useFetchOnMount } from '../../hooks/fetchOnMount';

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
