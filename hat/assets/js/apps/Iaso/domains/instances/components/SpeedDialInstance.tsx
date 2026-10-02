import React, { FunctionComponent } from 'react';

import { LoadingSpinner } from 'bluesquare-components';
import { UseMutateAsyncFunction } from 'react-query';
import {
    SHOW_LINK_INSTANCE_REFERENCE,
    useCurrentUserHasFeatureFlag,
} from '../../../utils/featureFlags';
import { useCheckUserHasWritePermissionOnOrgunit } from '../../../utils/usersUtils';
import { useGetEnketoUrl } from '../../registry/hooks/useGetEnketoUrl';
import { useCurrentUserHasPermission } from '../../users/utils';
import {
    useDeleteInstance,
    useRestoreInstance,
} from '../hooks/requests/useDeleteInstance';
import {
    useBaseActions,
    useDeleteAction,
    useEditLocationWithGpsAction,
    useEnketoAction,
    useLinkToOrgUnitAction,
    useLockAction,
} from '../hooks/speedDialActions';
import { SpeedDialAction } from '../hooks/speedDialActions';
import { useGetFormDefForInstance } from '../hooks/speeddials';
import { ReassignInstancePayload } from '../hooks/useReassignInstance';
import { Instance } from '../types/instance';
import SpeedDialInstanceActions from './SpeedDialInstanceActions';

type Props = {
    currentInstance: Instance;
    params: {
        instanceId: string;
        referenceFormId?: string;
    };
    reassignInstance: UseMutateAsyncFunction<
        unknown,
        unknown,
        ReassignInstancePayload,
        unknown
    >;
};

const SpeedDialInstance: FunctionComponent<Props> = props => {
    const {
        params: { referenceFormId },
        currentInstance,
        currentInstance: {
            form_id: formId,
            is_instance_of_reference_form: isInstanceOfReferenceForm,
            is_reference_instance: isReferenceInstance,
        },
        reassignInstance,
    } = props;
    const { data: formDef } = useGetFormDefForInstance(formId);
    const hasFeatureFlag = useCurrentUserHasFeatureFlag(
        SHOW_LINK_INSTANCE_REFERENCE,
    );

    const hasUpdateSubmissionPermission = useCurrentUserHasPermission(
        'iaso_update_submission',
    );

    const {
        org_unit: orgUnit,
        latitude: formLat,
        longitude: formLong,
        altitude: formAltitude,
    } = currentInstance ?? {};

    const hasOrgUnitPermission = useCheckUserHasWritePermissionOnOrgunit(
        orgUnit?.org_unit_type_id,
    );
    const isGpsEqual =
        hasOrgUnitPermission !== null &&
        formLat !== null &&
        formLong !== null &&
        formAltitude !== null &&
        formLat === orgUnit?.latitude &&
        formLong === orgUnit?.longitude &&
        formAltitude === orgUnit?.altitude;

    const isLinkActionEnabled =
        hasFeatureFlag && isInstanceOfReferenceForm && hasOrgUnitPermission;

    const baseActions = useBaseActions(
        currentInstance,
        reassignInstance,
        formDef,
    );

    const editLocationWithInstanceGps =
        useEditLocationWithGpsAction(currentInstance);

    const deleteRestore = useDeleteAction(currentInstance);

    const lockAction = useLockAction(currentInstance);

    const enketoAction = useEnketoAction(currentInstance);

    const linkOrgUnitAction = useLinkToOrgUnitAction({
        currentInstance,
        isReferenceInstance,
        formId,
        referenceFormId: referenceFormId ? parseInt(referenceFormId, 10) : null,
    });

    const { mutate: softDeleteInstance, isLoading: isDeleting } =
        useDeleteInstance();
    const { mutate: restoreInstance, isLoading: isRestoring } =
        useRestoreInstance();
    const getEnketoUrl = useGetEnketoUrl(window.location.href, currentInstance);
    const onActionSelected = (action: SpeedDialAction) => {
        if (currentInstance) {
            if (action.id === 'instanceEditAction') {
                getEnketoUrl();
            }
            if (action.id === 'instanceDeleteAction') {
                softDeleteInstance(currentInstance.id);
            }
            if (action.id === 'instanceRestoreAction') {
                restoreInstance(currentInstance.id);
            }
        }
    };

    const actions = [...baseActions, deleteRestore];

    if (!isGpsEqual && hasOrgUnitPermission) {
        actions.unshift(editLocationWithInstanceGps);
    }

    actions.unshift(lockAction, enketoAction);

    if (isLinkActionEnabled) {
        actions.push(linkOrgUnitAction);
    }

    return currentInstance?.can_user_modify && hasUpdateSubmissionPermission ? (
        <>
            {(isDeleting || isRestoring) && <LoadingSpinner />}
            <SpeedDialInstanceActions
                actions={actions}
                onActionSelected={action => onActionSelected(action)}
            />
        </>
    ) : null;
};

export default SpeedDialInstance;
