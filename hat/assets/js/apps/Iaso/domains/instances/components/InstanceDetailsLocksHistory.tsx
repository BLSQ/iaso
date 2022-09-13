/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import {
    Grid,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@material-ui/core';
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

const InstanceDetailsLocksHistory: FunctionComponent<{
    currentInstance: Instance;
}> = ({ currentInstance }: { currentInstance: Instance }) => {
    const { formatMessage } = useSafeIntl();
    const { isLoading, mutateAsync } = useSnackMutation<Instance>(
        instanceLock => {
            return postRequest('/api/instances/unlock_lock/', {
                lock: instanceLock.id,
            });
        },
        MESSAGES.lockSuccess,
    );
    // @ts-ignore
    return (
        <WidgetPaper
            id="export-requests"
            padded
            title={formatMessage(MESSAGES.instanceLocks)}
        >
            {isLoading && <LoadingSpinner fixed={false} />}
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
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                {formatMessage(MESSAGES.lockAuthorLabel)}
                            </TableCell>
                            <TableCell>
                                {' '}
                                {formatMessage(MESSAGES.lockTopOrgUnitLabel)}
                            </TableCell>
                            <TableCell>
                                {' '}
                                {formatMessage(MESSAGES.lockStatusLabel)}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentInstance.instance_locks.map(instanceLock => (
                            <TableRow key={instanceLock.id}>
                                <TableCell>
                                    {getDisplayName(instanceLock.locked_by)}
                                </TableCell>
                                <TableCell>
                                    {' '}
                                    {instanceLock.top_org_unit.name}
                                </TableCell>
                                <TableCell>
                                    {instanceLock.unlocked_by ? (
                                        <>
                                            <span
                                                title={formatMessage(
                                                    MESSAGES.lockOpened,
                                                )}
                                            >
                                                <LockOpenIcon />
                                                {getDisplayName(
                                                    instanceLock.unlocked_by,
                                                )}
                                            </span>
                                        </>
                                    ) : (
                                        <ConfirmCancelDialogComponent
                                            titleMessage={
                                                MESSAGES.removeLockAction
                                            }
                                            onConfirm={closeDialog => {
                                                mutateAsync(instanceLock).then(
                                                    () => {
                                                        closeDialog();
                                                        // FIXME
                                                        window.location.reload(
                                                            false,
                                                        );
                                                    },
                                                );
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
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </WidgetPaper>
    );
};

export default InstanceDetailsLocksHistory;
