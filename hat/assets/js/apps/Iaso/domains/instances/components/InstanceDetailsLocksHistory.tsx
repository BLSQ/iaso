import React, { FunctionComponent } from 'react';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import {
    Grid,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import {
    IconButton as IconButtonComponent,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import WidgetPaper from '../../../components/papers/WidgetPaperComponent';
import { postRequest } from '../../../libs/Api';
import { useSnackMutation } from '../../../libs/apiHooks';
import getDisplayName from '../../../utils/usersUtils';
import MESSAGES from '../messages';
import { Instance } from '../types/instance';

/**
 * Body of the locks history panel, without any surrounding paper, so it can be
 * dropped either in a WidgetPaper or in an accordion row of the detail rail.
 */
export const InstanceDetailsLocksHistoryContent: FunctionComponent<{
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
    const hasLocks = (currentInstance?.instance_locks?.length ?? 0) > 0;
    return (
        <>
            {isLoading && <LoadingSpinner fixed={false} />}
            {!hasLocks && (
                <Grid xs={5} container item>
                    <Typography
                        variant="body2"
                        color="inherit"
                        title={formatMessage(MESSAGES.lockAuthorLabel)}
                    >
                        {formatMessage(MESSAGES.NoLocksHistory)}
                    </Typography>
                </Grid>
            )}
            {hasLocks && (
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
        </>
    );
};

const InstanceDetailsLocksHistory: FunctionComponent<{
    currentInstance: Instance;
}> = ({ currentInstance }: { currentInstance: Instance }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <WidgetPaper
            id="locks-history"
            padded
            title={formatMessage(MESSAGES.instanceLocks)}
        >
            <InstanceDetailsLocksHistoryContent
                currentInstance={currentInstance}
            />
        </WidgetPaper>
    );
};

export default InstanceDetailsLocksHistory;
