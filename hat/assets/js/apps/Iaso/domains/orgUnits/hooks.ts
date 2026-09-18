import { useMemo } from 'react';
import { IntlMessage } from 'bluesquare-components';
import { useQueryClient } from 'react-query';
import { patchRequest, postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import MESSAGES from './messages';
import { OrgUnit } from './types/orgUnit';

// `useOrgUnitDetailData` used to live here too, but it's specific to the org unit details page
// (see `details/useOrgUnitDetailData.ts`) -- moved out so page-specific changes don't touch this
// file, whose other exports (`useSaveOrgUnit`, `useRefreshOrgUnit`, `useOrgUnitTabParams`) are used
// well beyond that page.

export type SaveOrgUnitPayload = Omit<Partial<OrgUnit>, 'groups'> & {
    groups?: number[];
};

export const useSaveOrgUnit = (
    onSuccess?: () => void,
    invalidateQueryKey?: string[],
    successMessage?: IntlMessage,
) => {
    return useSnackMutation<OrgUnit, unknown, SaveOrgUnitPayload, unknown>(
        body =>
            body.id
                ? patchRequest(`/api/orgunits/${body.id}/`, body)
                : postRequest('/api/orgunits/create_org_unit/', body),
        successMessage || MESSAGES.saveOrgUnitSuccesfull,
        MESSAGES.saveOrgUnitError,
        invalidateQueryKey,
        { onSuccess },
    );
};

export const useRefreshOrgUnit = () => {
    const queryClient = useQueryClient();
    return (data: OrgUnit) => {
        queryClient.invalidateQueries('currentOrgUnit');
        queryClient.invalidateQueries('logs');
        return queryClient.setQueryData(['forms', data.id], data);
    };
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
