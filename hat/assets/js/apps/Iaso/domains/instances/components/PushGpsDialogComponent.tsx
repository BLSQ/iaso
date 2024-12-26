import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { Grid, Stack, Typography } from '@mui/material';
import {
    LoadingSpinner,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import MESSAGES from '../messages';
import { Instance } from '../types/instance';
import { Selection } from '../../orgUnits/types/selection';
import { useGetCheckBulkGpsPush } from '../hooks/useGetCheckBulkGpsPush';
import PushBulkGpsWarning from './PushBulkGpsWarning';
import { useInstanceBulkgpspush } from '../hooks/useInstanceBulkgpspush';
import { baseUrls } from '../../../constants/urls';
import { userHasPermission } from '../../users/utils';
import * as Permission from '../../../utils/permissions';
import { useCurrentUser } from '../../../utils/usersUtils';

type Props = {
    renderTrigger: (openDialog: boolean) => void;
    selection: Selection<Instance>;
};

const PushGpsDialogComponent: FunctionComponent<Props> = ({
    renderTrigger,
    selection,
}) => {
    const currentUser = useCurrentUser();
    const [approveOrgUnitHasGps, setApproveOrgUnitHasGps] =
        useState<boolean>(true);
    const [approveSubmissionNoHasGps, setApproveSubmissionNoHasGps] =
        useState<boolean>(true);
    const { mutateAsync: bulkgpspush } = useInstanceBulkgpspush();
    const select_all = selection.selectAll;
    const selected_ids = selection.selectedItems;
    const unselected_ids = selection.unSelectedItems;

    const {
        data: checkBulkGpsPush,
        isError,
        isLoading: isLoadingCheckResult,
    } = useGetCheckBulkGpsPush({
        selected_ids: selected_ids.map(item => item.id).join(','),
        select_all,
        unselected_ids: unselected_ids.map(item => item.id).join(','),
    });

    const instancebulkgpspush = useCallback(async () => {
        await bulkgpspush({
            select_all,
            selected_ids: selected_ids.map(item => item.id),
            unselected_ids: unselected_ids.map(item => item.id),
        });
    }, [bulkgpspush, select_all, selected_ids, unselected_ids]);

    const onConfirm = useCallback(
        async closeDialog => {
            await instancebulkgpspush();
            closeDialog();
        },
        [instancebulkgpspush],
    );
    const redirectTo = useRedirectTo();
    const onConfirmAndSeeTask = useCallback(
        async closeDialog => {
            await instancebulkgpspush();
            closeDialog();
            redirectTo(baseUrls.tasks, {
                order: '-created_at',
            });
        },
        [instancebulkgpspush, redirectTo],
    );

    const onClosed = () => {
        return null;
    };

    const onApprove = useCallback(
        type => {
            if (type === 'instanceNoGps') {
                if (approveSubmissionNoHasGps) {
                    setApproveSubmissionNoHasGps(false);
                } else {
                    setApproveSubmissionNoHasGps(true);
                }
            }

            if (type === 'orgUnitHasGps') {
                if (approveOrgUnitHasGps) {
                    setApproveOrgUnitHasGps(false);
                } else {
                    setApproveOrgUnitHasGps(true);
                }
            }
        },
        [approveOrgUnitHasGps, approveSubmissionNoHasGps],
    );
    let title = MESSAGES.export;
    if (selection) {
        title = {
            ...MESSAGES.pushGpsToOrgUnits,
        };
    }
    const { formatMessage } = useSafeIntl();
    const hasTaskPermission = userHasPermission(
        Permission.DATA_TASKS,
        currentUser,
    );
    const displayWarningOverWriteGps = useMemo(() => {
        const isWarning =
            (checkBulkGpsPush?.warning_overwrite?.length ?? 0) > 0 &&
            (checkBulkGpsPush?.error_ids?.length ?? 0) <= 0;
        if (isWarning) {
            setApproveOrgUnitHasGps(false);
        } else {
            setApproveOrgUnitHasGps(true);
        }

        return isWarning;
    }, [
        checkBulkGpsPush?.error_ids?.length,
        checkBulkGpsPush?.warning_overwrite?.length,
    ]);

    const displayWarningSubmissionsNoGps = useMemo(() => {
        const isWarning =
            (checkBulkGpsPush?.warning_no_location?.length ?? 0) > 0 &&
            (checkBulkGpsPush?.error_ids?.length ?? 0) <= 0;
        if (isWarning) {
            setApproveOrgUnitHasGps(false);
        } else {
            setApproveOrgUnitHasGps(true);
        }

        return isWarning;
    }, [
        checkBulkGpsPush?.error_ids?.length,
        checkBulkGpsPush?.warning_no_location?.length,
    ]);

    const noLoadingAndNoError = useMemo(
        () => !isLoadingCheckResult && !isError,
        [isError, isLoadingCheckResult],
    );

    const approved = approveOrgUnitHasGps && approveSubmissionNoHasGps;

    return (
        // @ts-ignore
        <ConfirmCancelDialogComponent
            renderTrigger={({ openDialog }) => renderTrigger(openDialog)}
            titleMessage={noLoadingAndNoError ? title : ''}
            allowConfirm={noLoadingAndNoError && approved}
            onConfirm={closeDialog => onConfirm(closeDialog)}
            confirmMessage={MESSAGES.launch}
            onClosed={onClosed}
            cancelMessage={
                noLoadingAndNoError ? MESSAGES.cancel : MESSAGES.close
            }
            maxWidth="sm"
            additionalButton
            additionalMessage={MESSAGES.goToCurrentTask}
            onAdditionalButtonClick={closeDialog =>
                onConfirmAndSeeTask(closeDialog)
            }
            allowConfimAdditionalButton={
                hasTaskPermission && noLoadingAndNoError && approved
            }
            id="bulk-push-gps"
            dataTestId="bulk-push-gps"
        >
            {isLoadingCheckResult ? (
                <LoadingSpinner absolute />
            ) : (
                <Grid container spacing={4} alignItems="center">
                    <Grid item xs={12}>
                        <Typography variant="subtitle1">
                            {isError ? (
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    sx={{
                                        paddingLeft: '15px',
                                        paddingTop: '20px',
                                        marginRight: '100px',
                                        color: theme =>
                                            theme.palette.warning.main,
                                    }}
                                >
                                    <WarningAmberIcon />
                                    <Typography>
                                        {formatMessage(
                                            MESSAGES.multipleInstancesOneOrgUnitWarningMessage,
                                        )}
                                    </Typography>
                                </Stack>
                            ) : (
                                formatMessage(MESSAGES.pushGpsWarningMessage, {
                                    submissionCount: selection.selectCount,
                                    orgUnitCount: selection.selectCount,
                                })
                            )}
                        </Typography>
                    </Grid>
                    <PushBulkGpsWarning
                        condition={displayWarningSubmissionsNoGps}
                        message={MESSAGES.noGpsForSomeInstaces}
                        approveCondition={approveSubmissionNoHasGps}
                        onApproveClick={() => onApprove('instanceNoGps')}
                    />
                    <PushBulkGpsWarning
                        condition={displayWarningOverWriteGps}
                        message={MESSAGES.someOrgUnitsHasAlreadyGps}
                        approveCondition={approveOrgUnitHasGps}
                        onApproveClick={() => onApprove('orgUnitHasGps')}
                    />
                    {!approved && (
                        <Grid item xs={12}>
                            <Typography variant="subtitle1">
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                    sx={{
                                        color: theme =>
                                            theme.palette.warning.main,
                                    }}
                                >
                                    <WarningAmberIcon />
                                    <Typography>
                                        {formatMessage(
                                            MESSAGES.approveAllWarningsMessage,
                                        )}
                                    </Typography>
                                </Stack>
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            )}
        </ConfirmCancelDialogComponent>
    );
};
export default PushGpsDialogComponent;
