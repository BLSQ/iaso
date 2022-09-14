import { useCallback } from 'react';
import { UseQueryResult } from 'react-query';
import { useDispatch } from 'react-redux';
import { baseUrls } from '../../../../constants/urls';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { redirectTo } from '../../../../routing/actions';
import { useSaveOrgUnit } from '../../../orgUnits/hooks';
import { OrgUnit } from '../../../orgUnits/types/orgUnit';
import { Instance } from '../../types/instance';
import snackMessages from '../../../../components/snackBars/messages';

type LinkToFormParams = {
    // eslint-disable-next-line no-unused-vars
    formId: number;
    referenceFormId: number;
};

export const useLinkOrgUnitToReferenceSubmission = ({
    formId,
    referenceFormId,
}: LinkToFormParams): ((
    // eslint-disable-next-line no-unused-vars
    instance: Instance,
    // eslint-disable-next-line no-unused-vars
    isOrgUnitLinkable: boolean,
) => any) => {
    const { mutateAsync: saveOrgUnit } = useSaveOrgUnit(undefined, [
        'orgUnits',
    ]);
    const dispatch = useDispatch();
    return useCallback(
        (currentInstance: Instance, isOrgUnitLinkable: boolean) => {
            const { org_unit: orgUnit, id: instanceId } = currentInstance ?? {};
            const id = isOrgUnitLinkable ? instanceId : null;
            const orgUnitPayload: Partial<OrgUnit> = {
                id: orgUnit.id,
                reference_instance_id: id,
            };

            return saveOrgUnit(orgUnitPayload, {
                onSuccess: (result: OrgUnit) => {
                    const url = `${baseUrls.orgUnitDetails}/orgUnitId/${result.id}/formId/${formId}/referenceFormId/${referenceFormId}/instanceId/${id}`;
                    dispatch(redirectTo(url, {}));
                },
            });
        },
        [formId, referenceFormId, saveOrgUnit, dispatch],
    );
};

type FormOrgUnitTypes = {
    // eslint-disable-next-line camelcase
    org_unit_type_ids: number[];
};
// TODO move to hooks.js
export const useGetOrgUnitTypes = (
    formId: number | string | undefined,
): UseQueryResult<number[], Error> => {
    return useSnackQuery(
        ['form', formId, 'org_unit_types'],
        () => getRequest(`/api/forms/${formId}/?fields=org_unit_type_ids`),
        snackMessages.fetchFormError,
        {
            enabled: Boolean(formId),
            retry: false,
            select: (data: FormOrgUnitTypes): number[] =>
                data?.org_unit_type_ids ?? [],
        },
    );
};
