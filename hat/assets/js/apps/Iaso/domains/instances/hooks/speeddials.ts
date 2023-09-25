import { useCallback } from 'react';
import { UseQueryResult } from 'react-query';
import { useDispatch } from 'react-redux';
import { baseUrls } from '../../../constants/urls';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { redirectTo } from '../../../routing/actions';
import { useSaveOrgUnit } from '../../orgUnits/hooks';
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { Instance } from '../types/instance';
import snackMessages from '../../../components/snackBars/messages';
import { Nullable } from '../../../types/utils';

type LinkToFormParams = {
    // eslint-disable-next-line no-unused-vars
    formId: number;
    referenceFormId: Nullable<number>;
};

export const useLinkOrgUnitToReferenceSubmission = ({
    formId,
    referenceFormId,
}: LinkToFormParams): ((
    // eslint-disable-next-line no-unused-vars
    instance: Instance,
) => any) => {
    const { mutateAsync: saveOrgUnit } = useSaveOrgUnit(undefined, [
        'orgUnits',
    ]);
    const dispatch = useDispatch();
    return useCallback(
        (currentInstance: Instance) => {
            const {
                org_unit: orgUnit,
                id: instanceId,
                is_reference_instance: isReferenceInstance,
            } = currentInstance ?? {};
            const orgUnitPayload: Partial<OrgUnit> = {
                id: orgUnit.id,
                reference_instance_id: instanceId,
                reference_instance_action: isReferenceInstance
                    ? 'unflag'
                    : 'flag',
            };
            return saveOrgUnit(orgUnitPayload, {
                onSuccess: (result: OrgUnit) => {
                    const baseUrl = `${baseUrls.orgUnitDetails}/orgUnitId/${result.id}`;
                    const url = referenceFormId
                        ? `${baseUrl}/formId/${formId}/referenceFormId/${referenceFormId}/instanceId/${instanceId}`
                        : baseUrl;
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
    period_type: string | null;
    id: number;
};

export type FormDef = {
    orgUnitTypeIds: number[];
    periodType: string | null;
    id: number;
};

// TODO move to hooks.js
export const useGetFormDefForInstance = (
    formId: number | string | undefined,
): UseQueryResult<FormDef, Error> => {
    return useSnackQuery(
        ['form', formId, 'org_unit_types'],
        () =>
            getRequest(
                `/api/forms/${formId}/?fields=org_unit_type_ids,period_type`,
            ),
        snackMessages.fetchFormError,
        {
            enabled: Boolean(formId),
            retry: false,
            select: (data: FormOrgUnitTypes): FormDef => {
                return {
                    id: data.id,
                    orgUnitTypeIds: data.org_unit_type_ids ?? [],
                    periodType: data.period_type,
                };
            },
        },
    );
};
