import {
    fetchOrgUnitsTypes,
    fetchDevices,
    fetchDevicesOwnerships,
    fetchPeriods,
} from '../../utils/requests';
import { setOrgUnitTypes } from '../orgUnits/actions';
import { getRequest } from '../../libs/Api';
import { useSnackQuery } from '../../libs/apiHooks';
import {
    setDevicesList,
    setDevicesOwnershipList,
} from '../../redux/devicesReducer';
import { setPeriods } from '../periods/actions';

import { useFetchOnMount } from '../../hooks/fetchOnMount';

export const useInstancesFiltersData = (
    periodsList,
    formId,
    setFetchingOrgUnitTypes,
    setFetchingDevices,
    setFetchingDevicesOwnerships,
    setFetchingPeriodsList,
) => {
    const promisesArray = [
        {
            fetch: fetchOrgUnitsTypes,
            setFetching: setFetchingOrgUnitTypes,
            setData: setOrgUnitTypes,
        },
        {
            fetch: fetchDevices,
            setFetching: setFetchingDevices,
            setData: setDevicesList,
        },
        {
            fetch: fetchDevicesOwnerships,
            setFetching: setFetchingDevicesOwnerships,
            setData: setDevicesOwnershipList,
        },
    ];
    if (periodsList.length > 0) {
        promisesArray.push({
            fetch: fetchPeriods,
            setFetching: setFetchingPeriodsList,
            setData: setPeriods,
            args: [formId],
        });
    }

    useFetchOnMount(promisesArray);
};

export const useGetForms = () => {
    const params = {
        all: true,
        order: 'name',
        fields: 'name,period_type,label_keys,id',
    };
    const queryString = new URLSearchParams(params);

    return useSnackQuery(
        ['forms', params],
        () => getRequest(`/api/forms/?${queryString.toString()}`),
        undefined,
        {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    );
};
