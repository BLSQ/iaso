/* eslint-disable camelcase */
import React from 'react';
import { Grid, Typography } from '@material-ui/core';
// @ts-ignore
import {
    IconButton as IconButtonComponent,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import MESSAGES from '../messages';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import getDisplayName, { User } from '../../../utils/usersUtils';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import { postRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';

type Lock = {
    id: number;
    locked_by: User;
    unlocked_by?: User;
    top_org_unit: {
        name: string;
    };
};
type Instance = {
    instance_locks: Lock[];
    can_user_modify: boolean;
};

const InstanceDetailsLocksHistory = ({
    currentInstance,
}: {
    currentInstance: Instance;
}) => {
    const { formatMessage } = useSafeIntl();
    const unlockMutation = useSnackMutation<Instance>(instanceLock => {
        return postRequest('/api/instances/unlock_lock/', {
            lock: instanceLock.id,
        });
    }, MESSAGES.lockSuccess);
    // @ts-ignore
    return (
        <WidgetPaper
            id="export-requests"
            padded
            title={formatMessage(MESSAGES.instanceLocks)}
        >
            {unlockMutation.isLoading && <LoadingSpinner fixed={false} />}
            {currentInstance.instance_locks.length === 0 && (
                <Grid xs={5} container item justifyContent="center">
                    <Typography
                        variant="body2"
                        color="inherit"
                        title={formatMessage(MESSAGES.lockAuthorLabel)}
                    >
                        {formatMessage(MESSAGES.NoLocksHistory)}
                    </Typography>
                </Grid>
            )}
            {currentInstance.instance_locks.length > 0 && (
                <table>
                    <thead>
                        <tr>
                            <th>{formatMessage(MESSAGES.lockAuthorLabel)}</th>
                            <th>
                                {' '}
                                {formatMessage(MESSAGES.lockTopOrgUnitLabel)}
                            </th>
                            <th> {formatMessage(MESSAGES.lockStatusLabel)}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentInstance.instance_locks.map(instanceLock => (
                            <tr
                                key={instanceLock.id}
                                style={{
                                    height: '2em',
                                    verticalAlign: 'text-bottom',
                                }}
                            >
                                <td>
                                    {getDisplayName(instanceLock.locked_by)}
                                </td>
                                <td> {instanceLock.top_org_unit.name}</td>
                                <td>
                                    {instanceLock.unlocked_by ? (
                                        <>
                                            <span
                                                title={formatMessage(
                                                    MESSAGES.lockOpened,
                                                )}
                                            >
                                                <LockOpenIcon />
                                            </span>
                                            {getDisplayName(
                                                instanceLock.unlocked_by,
                                            )}
                                        </>
                                    ) : (
                                        <ConfirmCancelDialogComponent
                                            titleMessage={
                                                MESSAGES.removeLockAction
                                            }
                                            onConfirm={closeDialog => {
                                                unlockMutation
                                                    .mutateAsync(instanceLock)
                                                    .then(() => {
                                                        closeDialog();
                                                    });
                                            }}
                                            renderTrigger={({ openDialog }) => (
                                                <IconButtonComponent
                                                    onClick={openDialog}
                                                    overrideIcon={LockIcon}
                                                    disabled={
                                                        !currentInstance.can_user_modify
                                                    }
                                                    tooltipMessage={
                                                        MESSAGES.removeLockAction
                                                    }
                                                    style={{ height: '1em' }}
                                                />
                                            )}
                                        />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </WidgetPaper>
    );
};

export default InstanceDetailsLocksHistory;
