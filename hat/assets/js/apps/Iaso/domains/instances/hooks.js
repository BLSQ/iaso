import { useSnackQuery, useSnackMutation } from 'Iaso/libs/apiHooks.ts';
import { getRequest, patchRequest } from 'Iaso/libs/Api';
import {
    fetchOrgUnitsTypes,
    fetchDevices,
    fetchDevicesOwnerships,
} from '../../utils/requests';
import MESSAGES from './messages';
import { setOrgUnitTypes } from '../orgUnits/actions';
import {
    setDevicesList,
    setDevicesOwnershipList,
} from '../../redux/devicesReducer';

import { useFetchOnMount } from '../../hooks/fetchOnMount';

export const useInstancesFiltersData = (
    formId,
    setFetchingOrgUnitTypes,
    setFetchingDevices,
    setFetchingDevicesOwnerships,
) => {
    const promisesArray = [
        {
            fetch: fetchOrgUnitsTypes,
            setFetching: setFetchingOrgUnitTypes,
            setData: setOrgUnitTypes,
        },
    ];

    useFetchOnMount(promisesArray);
};

export const useGetForms = () => {
    const params = {
        all: true,
        order: 'name',
        fields: 'name,period_type,label_keys,id',
    };
    const queryString = new URLSearchParams(params);

    return useSnackQuery(['forms', params], () =>
        getRequest(`/api/forms/?${queryString.toString()}`),
    );
};

export const useGetFormsByProjects = () => {
    const params = {
        all: true,
        order: 'name',
        fields: 'name,period_type,label_keys,id,projects',
    };
    const queryString = new URLSearchParams(params);

    return useSnackQuery(['forms', params], () =>
        getRequest(`/api/forms/?${queryString.toString()}`),
    );
};

export const useGetPeriods = formId => {
    const params = {
        form_id: formId,
    };
    const queryString = new URLSearchParams(params);

    return useSnackQuery(['periods', params], () => {
        return getRequest(`/api/periods/?${queryString.toString()}`);
    });
};

export const usePatchInstance = (onSuccess, invalidateQueryKey = undefined) =>
    useSnackMutation(
        body => patchRequest(`/api/instances/${body.id}/`, body),
        MESSAGES.patchInstanceSuccesfull,
        MESSAGES.patchInstanceError,
        invalidateQueryKey,
        { onSuccess },
    );
