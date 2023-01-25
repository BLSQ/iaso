import { useSnackMutation, useSnackQuery } from 'Iaso/libs/apiHooks.ts';
import { getRequest, patchRequest, postRequest } from 'Iaso/libs/Api';
import { fetchOrgUnitsTypes } from '../../utils/requests';
import MESSAGES from './messages';
import { setOrgUnitTypes } from '../orgUnits/actions';

import { useFetchOnMount } from '../../hooks/fetchOnMount';

export const useInstancesFiltersData = (formId, setFetchingOrgUnitTypes) => {
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
        fields: 'name,period_type,label_keys,id,latest_form_version',
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

const postLockInstance = instance =>
    postRequest(`/api/instances/${instance.id}/add_lock/`);

export const usePostLockInstance = () => {
    return useSnackMutation({
        mutationFn: postLockInstance,
    });
};
