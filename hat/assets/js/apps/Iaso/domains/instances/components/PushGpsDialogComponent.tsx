import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { Grid, Typography } from '@mui/material';
import {
    LoadingSpinner,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
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
import PushGpsWarningMessage from './PushGpsWarningMessage';

type Props = {
    renderTrigger: (openDialog: boolean) => void;
    selection: Selection<Instance>;
};

const PushGpsDialogComponent: FunctionComponent<Props> = ({
    renderTrigger,
    selection,
}) => {
    const INSTANCE_HAS_NO_GPS = 'instanceHasNoGPS';
    const ORG_UNIT_HAS_ALREADY_GPS = 'orgUnitHasAlreadyGps';

    const currentUser = useCurrentUser();
    const [approveOrgUnitHasGps, setApproveOrgUnitHasGps] =
        useState<boolean>(true);
    const [approveSubmissionNoHasGps, setApproveSubmissionNoHasGps] =
        useState<boolean>(true);

    const [approved, setApproved] = useState<boolean>(true);

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

    const initializeWarningApproval = useCallback(() => {
        setApproved(false);
        evaluateWarning(
            checkBulkGpsPush?.warning_overwrite,
            checkBulkGpsPush?.error_ids,
            setApproveOrgUnitHasGps,
        );
        evaluateWarning(
            checkBulkGpsPush?.warning_no_location,
            checkBulkGpsPush?.error_ids,
            setApproveSubmissionNoHasGps,
        );
    }, [
        checkBulkGpsPush?.error_ids,
        checkBulkGpsPush?.warning_no_location,
        checkBulkGpsPush?.warning_overwrite,
    ]);

    const onConfirm = useCallback(
        async closeDialog => {
            await instancebulkgpspush();
            initializeWarningApproval();
            closeDialog();
        },
        [initializeWarningApproval, instancebulkgpspush],
    );

    const redirectTo = useRedirectTo();
    const onConfirmAndSeeTask = useCallback(
        async closeDialog => {
            await instancebulkgpspush();
            initializeWarningApproval();
            closeDialog();
            redirectTo(baseUrls.tasks, {
                order: '-created_at',
            });
        },
        [initializeWarningApproval, instancebulkgpspush, redirectTo],
    );

    const onClosed = () => {
        initializeWarningApproval();
        return null;
    };

    const onApprove = useCallback(
        type => {
            const toggleApproval = (currentValue, setFunction) => {
                setFunction(!currentValue);
            };

            if (type === INSTANCE_HAS_NO_GPS) {
                toggleApproval(
                    approveSubmissionNoHasGps,
                    setApproveSubmissionNoHasGps,
                );
            } else if (type === ORG_UNIT_HAS_ALREADY_GPS) {
                toggleApproval(approveOrgUnitHasGps, setApproveOrgUnitHasGps);
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

    const evaluateWarning = (
        warningCondition,
        errorCondition,
        setApproveFunction,
    ) => {
        const isWarning =
            (warningCondition?.length ?? 0) > 0 &&
            (errorCondition?.length ?? 0) <= 0;
        setApproveFunction(!isWarning);
        return isWarning;
    };

    const displayWarningOverWriteGps = useMemo(
        () =>
            evaluateWarning(
                checkBulkGpsPush?.warning_overwrite,
                checkBulkGpsPush?.error_ids,
                setApproveOrgUnitHasGps,
            ),
        [checkBulkGpsPush?.warning_overwrite, checkBulkGpsPush?.error_ids],
    );

    const displayWarningSubmissionsNoGps = useMemo(
        () =>
            evaluateWarning(
                checkBulkGpsPush?.warning_no_location,
                checkBulkGpsPush?.error_ids,
                setApproveSubmissionNoHasGps,
            ),
        [checkBulkGpsPush?.warning_no_location, checkBulkGpsPush?.error_ids],
    );

    const noLoadingAndNoError = useMemo(
        () => !isLoadingCheckResult && !isError,
        [isError, isLoadingCheckResult],
    );

    useEffect(() => {
        setApproved(approveOrgUnitHasGps && approveSubmissionNoHasGps);
    }, [approveOrgUnitHasGps, approveSubmissionNoHasGps]);

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
                                <PushGpsWarningMessage
                                    message={formatMessage(
                                        MESSAGES.multipleInstancesOneOrgUnitWarningMessage,
                                    )}
                                    paddingLeft="15px"
                                    paddingTop="20px"
                                    marginRight="100px"
                                />
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
                        onApproveClick={() => onApprove(INSTANCE_HAS_NO_GPS)}
                    />
                    <PushBulkGpsWarning
                        condition={displayWarningOverWriteGps}
                        message={MESSAGES.someOrgUnitsHasAlreadyGps}
                        approveCondition={approveOrgUnitHasGps}
                        onApproveClick={() =>
                            onApprove(ORG_UNIT_HAS_ALREADY_GPS)
                        }
                    />
                    {!approved && (
                        <Grid item xs={12}>
                            <Typography variant="subtitle1">
                                <PushGpsWarningMessage
                                    message={formatMessage(
                                        MESSAGES.approveAllWarningsMessage,
                                    )}
                                />
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            )}
        </ConfirmCancelDialogComponent>
    );
};
export default PushGpsDialogComponent;
