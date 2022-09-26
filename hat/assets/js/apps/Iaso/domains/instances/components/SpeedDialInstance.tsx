/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import {
    fetchEditUrl as fetchEditUrlAction,
    fetchInstanceDetail as fetchInstanceDetailAction,
    reAssignInstance as reAssignInstanceAction,
    restoreInstance as restoreInstanceAction,
    setCurrentInstance as setCurrentInstanceAction,
    softDeleteInstance as softDeleteAction,
} from '../actions';
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
import { useGetOrgUnitTypes } from '../hooks/speeddials';

type Props = {
    currentInstance: Instance;
    fetchEditUrl: CallableFunction;
    softDelete: CallableFunction;
    restoreInstance: CallableFunction;
    reAssignInstance: CallableFunction;
    params: {
        instanceId: string;
        referenceFormId?: string;
    };
};

const SpeedDialInstance: FunctionComponent<Props> = props => {
    const {
        reAssignInstance,
        params: { referenceFormId },
        currentInstance,
        currentInstance: { form_id: formId },
    } = props;
    const { data: orgUnitTypeIds } = useGetOrgUnitTypes(formId);
    const currentUser = useCurrentUser();
    const hasfeatureFlag = hasFeatureFlag(
        currentUser,
        SHOW_LINK_INSTANCE_REFERENCE,
    );
    const hasOrgUnitPermission = userHasPermission(
        'iaso_org_units',
        currentUser,
    );
    const isOrgUnitAlreadyLinked =
        currentInstance.org_unit.reference_instance_id !== null;
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

    const baseActions = useBaseActions(
        currentInstance,
        orgUnitTypeIds as number[], // forcing the type cast as the select in react-query prevent it from being undefined
        // @ts-ignore
        reAssignInstance,
    );

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

    const onActionSelected = action => {
        if (action.id === 'instanceEditAction' && props.currentInstance) {
            props.fetchEditUrl(props.currentInstance, window.location);
        }

        if (action.id === 'instanceDeleteAction' && props.currentInstance) {
            props.softDelete(props.currentInstance);
        }
        if (action.id === 'instanceRestoreAction' && props.currentInstance) {
            props.restoreInstance(props.currentInstance);
        }
    };

    const actions = [...baseActions, deleteRestore];

    if (isGpsEqual) {
        actions.unshift(editLocationWithInstanceGps);
    }

    actions.unshift(lockAction, enketoAction);

    if (isLinkActionEnabled) {
        actions.push(linkOrgUnitAction);
    }

    return currentInstance?.can_user_modify ? (
        <SpeedDialInstanceActions
            actions={actions}
            onActionSelected={action => onActionSelected(action)}
        />
    ) : null;
};

const MapStateToProps = () => ({});
const MapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            fetchInstanceDetail: fetchInstanceDetailAction,
            fetchEditUrl: fetchEditUrlAction,
            softDelete: softDeleteAction,
            restoreInstance: restoreInstanceAction,
            setCurrentInstance: setCurrentInstanceAction,
            reAssignInstance: reAssignInstanceAction,
        },
        dispatch,
    ),
});

export default connect(MapStateToProps, MapDispatchToProps)(SpeedDialInstance);
