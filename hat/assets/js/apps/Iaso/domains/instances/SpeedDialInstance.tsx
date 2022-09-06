/* eslint-disable react/jsx-props-no-spreading */
import React, { FunctionComponent } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import DeleteIcon from '@material-ui/icons/Delete';
import UpdateIcon from '@material-ui/icons/Update';
import EditLocationIcon from '@material-ui/icons/EditLocation';
import RestoreFromTrashIcon from '@material-ui/icons/RestoreFromTrash';
import LockIcon from '@material-ui/icons/Lock';
import { DialogContentText } from '@material-ui/core';
import LinkIcon from '@material-ui/icons/Link';
import LinkOffIcon from '@material-ui/icons/LinkOff';

import {
    // @ts-ignore
    ExportButton as ExportButtonComponent,
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';
import omit from 'lodash/omit';
import { UseQueryResult } from 'react-query';
import {
    fetchEditUrl as fetchEditUrlAction,
    fetchInstanceDetail as fetchInstanceDetailAction,
    reAssignInstance as reAssignInstanceAction,
    restoreInstance as restoreInstanceAction,
    setCurrentInstance as setCurrentInstanceAction,
    softDeleteInstance as softDeleteAction,
} from './actions';
import {
    redirectTo as redirectToAction,
    redirectToReplace as redirectToReplaceAction,
} from '../../routing/actions';
import CreateReAssignDialogComponent from './components/CreateReAssignDialogComponent';
import snackMessages from '../../components/snackBars/messages';
import SpeedDialInstanceActions from './components/SpeedDialInstanceActions';
import ExportInstancesDialogComponent from './components/ExportInstancesDialogComponent';
import ConfirmCancelDialogComponent from '../../components/dialogs/ConfirmCancelDialogComponent';
import EnketoIcon from './components/EnketoIcon';
import { userHasPermission } from '../users/utils';
import { getRequest } from '../../libs/Api';
import MESSAGES from './messages';
import { baseUrls } from '../../constants/urls';
import {
    lockInstanceWithDispatch,
    saveOrgUnitWithDispatch,
} from '../../utils/requests';

import {
    hasFeatureFlag,
    SHOW_LINK_INSTANCE_REFERENCE,
} from '../../utils/featureFlags';
import { useCurrentUser } from '../../utils/usersUtils';
import { Instance } from './types/instance';
import { useSnackQuery } from '../../libs/apiHooks';

const initialFormState = (orgUnit, value, key) => {
    const orgUnitCopy = {
        id: orgUnit.id,
        name: orgUnit.name,
        org_unit_type_id: orgUnit?.org_unit_type_id ?? undefined,
        groups: orgUnit.groups.map(g => g) ?? [],
        sub_source: orgUnit.sub_source,
        validation_status: orgUnit.validation_status,
        aliases: orgUnit.aliases,
        parent_id: orgUnit.parent_id,
        source_ref: orgUnit.source_ref,
    };

    if (key === 'gps') {
        orgUnitCopy.altitude = value.altitude;
        orgUnitCopy.latitude = value.latitude;
        orgUnitCopy.longitude = value.longitude;
    } else {
        orgUnitCopy.reference_instance_id = value;
    }
    return orgUnitCopy;
};

const linkOrLinkOffOrgUnitToReferenceSubmission = (
    orgUnit,
    referenceSubmissionId,
    redirectToActionInstance,
    formId,
    instanceId,
    referenceFormId,
) => {
    const currentOrgUnit = orgUnit;
    const newOrgUnit = initialFormState(
        orgUnit,
        referenceSubmissionId,
        'instance_reference',
    );
    let orgUnitPayload = omit({ ...currentOrgUnit, ...newOrgUnit });

    orgUnitPayload = {
        ...orgUnitPayload,
        groups:
            orgUnitPayload.groups.length > 0 && !orgUnitPayload.groups[0].id
                ? orgUnitPayload.groups
                : orgUnitPayload.groups.map(g => g.id),
    };
    saveOrgUnitWithDispatch(orgUnitPayload).then(ou => {
        const url = `${baseUrls.orgUnitDetails}/orgUnitId/${ou.id}/formId/${formId}/referenceFormId/${referenceFormId}/instanceId/${instanceId}`;
        redirectToActionInstance(url, {});
    });
};

const editGpsFromInstance = (instance, gps) => {
    const currentOrgUnit = instance.org_unit;
    const newOrgUnit = initialFormState(instance.org_unit, gps, 'gps');
    let orgUnitPayload = omit({ ...currentOrgUnit, ...newOrgUnit });

    orgUnitPayload = {
        ...orgUnitPayload,
        groups:
            orgUnitPayload.groups.length > 0 && !orgUnitPayload.groups[0].id
                ? orgUnitPayload.groups
                : orgUnitPayload.groups.map(g => g.id),
    };
    saveOrgUnitWithDispatch(orgUnitPayload).then(() => {
        window.location.reload(false);
    });
    return null;
};

type FormOrgUnitTypes = {
    // eslint-disable-next-line camelcase
    org_unit_type_ids: number[];
};
// TODO move to hooks.js
export const useGetOrgUnitTypes = (
    formId: number | string | undefined,
): UseQueryResult<FormOrgUnitTypes, Error> => {
    return useSnackQuery<FormOrgUnitTypes, Error>(
        ['form', formId, 'org_unit_types'],
        () => getRequest(`/api/forms/${formId}/?fields=org_unit_type_ids`),
        snackMessages.fetchFormError,
        {
            enabled: Boolean(formId),
            retry: false,
        },
    );
};
type Props = {
    currentInstance: Instance;
    fetchEditUrl: CallableFunction;
    softDelete: CallableFunction;
    restoreInstance: CallableFunction;
    reAssignInstance: CallableFunction;
    redirectToActionInstance: any;
    params: {
        instanceId: string;
        referenceFormId: string;
    };
};

const SpeedDialInstance: FunctionComponent<Props> = props => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const {
        reAssignInstance,
        params,
        redirectToActionInstance,
        currentInstance,
    } = props;
    const { data: formOrgUnitType } = useGetOrgUnitTypes(
        currentInstance.form_id,
    );
    const orgUnitTypeIds = formOrgUnitType?.org_unit_type_ids;
    const formId = currentInstance.form_id;

    let actions = [
        {
            id: 'instanceExportAction',
            icon: (
                <ExportInstancesDialogComponent
                    renderTrigger={(openDialog, isInstancesFilterUpdated) => (
                        <ExportButtonComponent
                            onClick={openDialog}
                            isDisabled={isInstancesFilterUpdated}
                            batchExport={false}
                        />
                    )}
                    getFilters={() => ({
                        form_id: currentInstance.form_id,
                        search: `ids:${currentInstance.id}`,
                    })}
                />
            ),
            disabled: currentInstance && currentInstance.deleted,
        },
        {
            id: 'instanceReAssignAction',
            icon: (
                <CreateReAssignDialogComponent
                    titleMessage={MESSAGES.reAssignInstance}
                    confirmMessage={MESSAGES.reAssignInstanceAction}
                    currentInstance={currentInstance}
                    orgUnitTypes={orgUnitTypeIds}
                    onCreateOrReAssign={reAssignInstance}
                    renderTrigger={({ openDialog }) => (
                        <UpdateIcon onClick={openDialog} />
                    )}
                />
            ),
            disabled: currentInstance && currentInstance.deleted,
        },
    ];

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

    const hasOrgUnitPermission = userHasPermission(
        'iaso_org_units',
        currentUser,
    );

    const hasfeatureFlag = hasFeatureFlag(
        currentUser,
        SHOW_LINK_INSTANCE_REFERENCE,
    );

    const enketoAction = {
        id: 'instanceEditAction',
        icon: <EnketoIcon />,
        disabled: currentInstance?.deleted,
    };

    const gpsEqual = instance => {
        const orgUnit = instance.org_unit;
        const formLat = instance?.latitude;
        const formLong = instance?.longitude;
        const formAltitude = instance?.altitude;
        return (
            formLat === orgUnit?.latitude &&
            formLong === orgUnit?.longitude &&
            formAltitude === orgUnit?.altitude
        );
    };

    const editLocationWithInstanceGps = {
        id: 'editLocationWithInstanceGps',
        icon: (
            <ConfirmCancelDialogComponent
                titleMessage={MESSAGES.editGpsFromInstanceTitle}
                onConfirm={() =>
                    editGpsFromInstance(currentInstance, {
                        altitude: currentInstance?.altitude,
                        latitude: currentInstance?.latitude,
                        longitude: currentInstance?.longitude,
                    })
                }
                renderTrigger={({ openDialog }) => (
                    <EditLocationIcon onClick={openDialog} />
                )}
            >
                <DialogContentText id="alert-dialog-description">
                    {formatMessage(MESSAGES.editGpsFromInstanceWarning)}
                </DialogContentText>
            </ConfirmCancelDialogComponent>
        ),
        disabled: currentInstance?.deleted,
    };

    const deleteRestore = {
        id:
            currentInstance && currentInstance.deleted
                ? 'instanceRestoreAction'
                : 'instanceDeleteAction',
        icon:
            currentInstance && currentInstance.deleted ? (
                <RestoreFromTrashIcon />
            ) : (
                <DeleteIcon />
            ),
        disabled: false,
    };

    const confirmLockUnlockInstance = instance => {
        const instanceParams = {
            id: instance.id,
        };
        return lockInstanceWithDispatch(instanceParams);
    };

    const lockAction = {
        id: 'lockActionTooltip', // used by translation
        disabled: currentInstance?.deleted,
        icon: (
            <ConfirmCancelDialogComponent
                titleMessage={MESSAGES.lockAction}
                onConfirm={closeDialog => {
                    confirmLockUnlockInstance(currentInstance).then(() => {
                        closeDialog();
                        window.location.reload(false);
                    });
                }}
                renderTrigger={({ openDialog }) => (
                    <LockIcon onClick={openDialog} />
                )}
            >
                <DialogContentText id="alert-dialog-description">
                    {formatMessage(MESSAGES.lockActionDescription)}
                    <br />
                    {currentInstance.is_locked &&
                        formatMessage(
                            MESSAGES.lockActionExistingLockDescription,
                        )}
                </DialogContentText>
            </ConfirmCancelDialogComponent>
        ),
    };
    const { referenceFormId } = params;
    const referenceSubmission = currentInstance.org_unit.reference_instance_id;
    const linkOrgUnit =
        formId.toString() !== referenceFormId && referenceSubmission !== null;
    const orgUnitToReferenceSubmission = instance => {
        return linkOrLinkOffOrgUnitToReferenceSubmission(
            currentInstance.org_unit,
            instance,
            redirectToActionInstance,
            formId,
            currentInstance.id,
            referenceFormId,
        );
    };

    if (
        currentInstance?.altitude !== null &&
        currentInstance?.latitude !== null &&
        currentInstance?.longitude !== null &&
        hasOrgUnitPermission !== null &&
        !gpsEqual(currentInstance)
    ) {
        actions = [editLocationWithInstanceGps, ...actions];
    }

    actions = [lockAction, enketoAction, ...actions, deleteRestore];

    if (
        hasOrgUnitPermission &&
        hasfeatureFlag &&
        formId.toString() === referenceFormId
    ) {
        const confirmCancelTitleMessage = isItLinked => {
            return isItLinked
                ? MESSAGES.linkOffOrgUnitToInstanceReferenceTitle
                : MESSAGES.linkOrgUnitToInstanceReferenceTitle;
        };
        const linkOrgUnitAction = {
            id: linkOrgUnit
                ? 'linkOffOrgUnitReferenceSubmission'
                : 'linkOrgUnitReferenceSubmission',
            icon: (
                <ConfirmCancelDialogComponent
                    titleMessage={confirmCancelTitleMessage(linkOrgUnit)}
                    onConfirm={() =>
                        linkOrgUnit
                            ? orgUnitToReferenceSubmission(null)
                            : orgUnitToReferenceSubmission(currentInstance.id)
                    }
                    renderTrigger={({ openDialog }) =>
                        linkOrgUnit ? (
                            <LinkOffIcon onClick={openDialog} />
                        ) : (
                            <LinkIcon onClick={openDialog} />
                        )
                    }
                >
                    <DialogContentText id="alert-dialog-description">
                        {formatMessage(
                            MESSAGES.linkOrgUnitToInstanceReferenceWarning,
                        )}
                    </DialogContentText>
                </ConfirmCancelDialogComponent>
            ),
            disabled: currentInstance?.deleted,
        };
        actions = [...actions, linkOrgUnitAction];
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
            redirectToReplace: redirectToReplaceAction,
            setCurrentInstance: setCurrentInstanceAction,
            reAssignInstance: reAssignInstanceAction,
            redirectToActionInstance: redirectToAction,
        },
        dispatch,
    ),
});

export default connect(MapStateToProps, MapDispatchToProps)(SpeedDialInstance);
