/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent } from 'react';

import { LoadingSpinner } from 'bluesquare-components';
import SpeedDialInstanceActions from './SpeedDialInstanceActions';
import { userHasPermission } from '../../users/utils';
import {
    hasFeatureFlag,
    SHOW_LINK_INSTANCE_REFERENCE,
} from '../../../utils/featureFlags';
import { useCurrentUser } from '../../../utils/usersUtils';
import { Instance } from '../types/instance';
import {
    useBaseActions,
    useDeleteAction,
    useEditLocationWithGpsAction,
    useEnketoAction,
    useLinkToOrgUnitAction,
    useLockAction,
} from '../hooks/speedDialActions';
import { useGetFormDefForInstance } from '../hooks/speeddials';
import {
    useDeleteInstance,
    useRestoreInstance,
} from '../hooks/requests/useDeleteInstance';
import { useGetEnketoUrl } from '../../registry/hooks/useGetEnketoUrl';
import * as Permission from '../../../utils/permissions';

type Props = {
    currentInstance: Instance;
    params: {
        instanceId: string;
        referenceFormId?: string;
    };
};

const SpeedDialInstance: FunctionComponent<Props> = props => {
    const {
        params: { referenceFormId },
        currentInstance,
        currentInstance: { form_id: formId },
    } = props;
    const { data: formDef } = useGetFormDefForInstance(formId);
    const currentUser = useCurrentUser();
    const hasfeatureFlag = hasFeatureFlag(
        currentUser,
        SHOW_LINK_INSTANCE_REFERENCE,
    );
    const hasOrgUnitPermission = userHasPermission(
        Permission.ORG_UNITS,
        currentUser,
    );
    const isOrgUnitAlreadyLinked =
        currentInstance.org_unit?.reference_instance_id !== null;
    const {
        org_unit: orgUnit,
        latitude: formLat,
        longitude: formLong,
        altitude: formAltitude,
    } = currentInstance ?? {};

    const isGpsEqual =
        hasOrgUnitPermission !== null &&
        formLat !== null &&
        formLong !== null &&
        formAltitude !== null &&
        formLat === orgUnit?.latitude &&
        formLong === orgUnit?.longitude &&
        formAltitude === orgUnit?.altitude;

    const isLinkActionEnabled =
        hasOrgUnitPermission &&
        hasfeatureFlag &&
        formId.toString() === referenceFormId;

    const baseActions = useBaseActions(currentInstance, formDef);

    const editLocationWithInstanceGps =
        useEditLocationWithGpsAction(currentInstance);

    const deleteRestore = useDeleteAction(currentInstance);

    const lockAction = useLockAction(currentInstance);

    const enketoAction = useEnketoAction(currentInstance);

    const linkOrgUnitAction = useLinkToOrgUnitAction({
        currentInstance,
        isOrgUnitAlreadyLinked,
        formId,
        referenceFormId: referenceFormId ? parseInt(referenceFormId, 10) : null,
    });

    const { mutate: softDeleteInstance, isLoading: isDeleting } =
        useDeleteInstance();
    const { mutate: restoreInstance, isLoading: isRestoring } =
        useRestoreInstance();
    const getEnketoUrl = useGetEnketoUrl(window.location.href, currentInstance);
    const onActionSelected = action => {
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

    if (!isGpsEqual) {
        actions.unshift(editLocationWithInstanceGps);
    }

    actions.unshift(lockAction, enketoAction);

    if (isLinkActionEnabled) {
        actions.push(linkOrgUnitAction);
    }

    return currentInstance?.can_user_modify ? (
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
