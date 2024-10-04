import React, { ReactElement, useCallback, useMemo } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import EditLocationIcon from '@mui/icons-material/EditLocation';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import LockIcon from '@mui/icons-material/Lock';
import { ExportButton, useSafeIntl } from 'bluesquare-components';
import { DialogContentText } from '@mui/material';
import { useDispatch } from 'react-redux';
import EnketoIcon from '../components/EnketoIcon';
import ExportInstancesDialogComponent from '../components/ExportInstancesDialogComponent';
import MESSAGES from '../messages';
import { Instance } from '../types/instance';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { useSaveOrgUnit } from '../../orgUnits/hooks';
import { usePostLockInstance } from '../hooks';
import { FormDef, useLinkOrgUnitToReferenceSubmission } from './speeddials';
import { Nullable } from '../../../types/utils';
import { reAssignInstance } from '../actions';
import { ReAssignDialog } from '../components/CreateReAssignDialogComponent';

export type SpeedDialAction = {
    id: string;
    icon: ReactElement;
    disabled?: boolean;
};

export const useBaseActions = (
    currentInstance: Instance,
    formDef?: FormDef,
): SpeedDialAction[] => {
    const dispatch = useDispatch();
    const onReAssignInstance = useCallback(
        (...props) => {
            dispatch(reAssignInstance(...props));
        },
        [dispatch],
    );
    return useMemo(() => {
        return [
            {
                id: 'instanceExportAction',
                icon: (
                    <ExportInstancesDialogComponent
                        // @ts-ignore
                        renderTrigger={(
                            openDialog,
                            isInstancesFilterUpdated,
                        ) => (
                            <ExportButton
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
                    <ReAssignDialog
                        titleMessage={MESSAGES.reAssignInstance}
                        confirmMessage={MESSAGES.reAssignInstanceAction}
                        currentInstance={currentInstance}
                        orgUnitTypes={formDef?.orgUnitTypeIds}
                        formType={formDef}
                        onCreateOrReAssign={onReAssignInstance}
                    />
                ),
                disabled: currentInstance && currentInstance.deleted,
            },
        ];
    }, [currentInstance, formDef, onReAssignInstance]);
};

export const useEditLocationWithGpsAction = (
    currentInstance: Instance,
): SpeedDialAction => {
    const { formatMessage } = useSafeIntl();
    const payload = useMemo(
        () => ({
            id: currentInstance.org_unit?.id,
            altitude: currentInstance?.altitude,
            latitude: currentInstance?.latitude,
            longitude: currentInstance?.longitude,
        }),
        [
            currentInstance?.altitude,
            currentInstance?.latitude,
            currentInstance?.longitude,
            currentInstance.org_unit,
        ],
    );
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const { mutateAsync: saveOrgUnit } = useSaveOrgUnit(() => {}, [
        'orgUnits',
        'instance',
    ]);
    return useMemo(
        () => ({
            id: 'editLocationWithInstanceGps',
            icon: (
                // @ts-ignore
                <ConfirmCancelDialogComponent
                    titleMessage={MESSAGES.editGpsFromInstanceTitle}
                    onConfirm={() => saveOrgUnit(payload)}
                    renderTrigger={({ openDialog }) => (
                        <EditLocationIcon onClick={openDialog} />
                    )}
                >
                    <DialogContentText id="alert-dialog-description">
                        {formatMessage(MESSAGES.editGpsFromInstanceWarning)}
                    </DialogContentText>
                </ConfirmCancelDialogComponent>
            ),
            disabled: currentInstance?.deleted || !currentInstance.org_unit,
        }),
        [
            currentInstance?.deleted,
            currentInstance.org_unit,
            formatMessage,
            payload,
            saveOrgUnit,
        ],
    );
};

// TODO use DeleteModal
export const useDeleteAction = (currentInstance: Instance): SpeedDialAction =>
    useMemo(() => {
        return {
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
    }, [currentInstance]);

export const useLockAction = (currentInstance: Instance): SpeedDialAction => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: switchInstanceLock } = usePostLockInstance();
    return useMemo(() => {
        return {
            id: 'lockActionTooltip', // used by translation
            disabled: currentInstance?.deleted,
            icon: (
                // @ts-ignore
                <ConfirmCancelDialogComponent
                    titleMessage={MESSAGES.lockAction}
                    onConfirm={closeDialog => {
                        switchInstanceLock(currentInstance).then(() => {
                            closeDialog();
                            // @ts-ignore
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
    }, [currentInstance, formatMessage, switchInstanceLock]);
};

export const useEnketoAction = (currentInstance: Instance): SpeedDialAction => {
    return useMemo(() => {
        return {
            id: 'instanceEditAction',
            icon: <EnketoIcon />,
            disabled: currentInstance?.deleted,
        };
    }, [currentInstance?.deleted]);
};

type LinkToActionParams = {
    currentInstance: Instance;
    isReferenceInstance: boolean;
    formId: number;
    referenceFormId: Nullable<number>;
};

const renderTrigger =
    (isAlreadyLinked: boolean) =>
    ({ openDialog }) =>
        isAlreadyLinked ? (
            <LinkOffIcon onClick={openDialog} />
        ) : (
            <LinkIcon onClick={openDialog} />
        );

export const useLinkToOrgUnitAction = ({
    currentInstance,
    isReferenceInstance,
    formId,
    referenceFormId,
}: LinkToActionParams): SpeedDialAction => {
    const { formatMessage } = useSafeIntl();
    const titleMessage = isReferenceInstance
        ? MESSAGES.linkOffOrgUnitToInstanceReferenceTitle
        : MESSAGES.linkOrgUnitToInstanceReferenceTitle;

    const linkToSubmission = useLinkOrgUnitToReferenceSubmission({
        formId,
        referenceFormId,
    });
    return useMemo(() => {
        return {
            id: isReferenceInstance
                ? 'linkOffOrgUnitReferenceSubmission'
                : 'linkOrgUnitReferenceSubmission',
            icon: (
                // @ts-ignore
                <ConfirmCancelDialogComponent
                    titleMessage={titleMessage}
                    onConfirm={() => linkToSubmission(currentInstance)}
                    renderTrigger={renderTrigger(isReferenceInstance)}
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
    }, [
        currentInstance,
        formatMessage,
        isReferenceInstance,
        linkToSubmission,
        titleMessage,
    ]);
};
