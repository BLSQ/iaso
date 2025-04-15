import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { Grid, Typography } from '@mui/material';
import {
    ConfirmCancelModal,
    LoadingSpinner,
    makeFullModal,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import { baseUrls } from '../../../../constants/urls';
import * as Permission from '../../../../utils/permissions';
import { useCurrentUser } from '../../../../utils/usersUtils';
import { Selection } from '../../../orgUnits/types/selection';
import { userHasPermission } from '../../../users/utils';
import { useGetCheckBulkGpsPush } from '../../hooks/useGetCheckBulkGpsPush';
import { useInstanceBulkgpspush } from '../../hooks/useInstanceBulkgpspush';
import MESSAGES from '../../messages';
import { Instance } from '../../types/instance';
import WarningMessage from '../../utils/WarningMessage';
import PushBulkGpsWarning from './PushBulkGpsWarning';
import { PushGpsModalButton } from './PushGpsModalButton';

type Props = {
    selection: Selection<Instance>;
    isOpen: boolean;
    closeDialog: () => void;
};

const PushGpsDialogComponent: FunctionComponent<Props> = ({
    selection,
    isOpen,
    closeDialog,
}) => {
    const INSTANCE_HAS_NO_GPS = 'instanceHasNoGPS';
    const ORG_UNIT_HAS_ALREADY_GPS = 'orgUnitHasAlreadyGps';

    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();

    const redirectTo = useRedirectTo();

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

    const onConfirm = useCallback(async () => {
        await instancebulkgpspush();
        closeDialog();
    }, [closeDialog, instancebulkgpspush]);

    const onConfirmAndSeeTask = useCallback(async () => {
        await instancebulkgpspush();
        closeDialog();
        redirectTo(baseUrls.tasks, {
            order: '-created_at',
        });
    }, [closeDialog, instancebulkgpspush, redirectTo]);

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
        <ConfirmCancelModal
            allowConfirm={noLoadingAndNoError && approved}
            titleMessage={noLoadingAndNoError ? MESSAGES.pushGpsToOrgUnits : ''}
            onConfirm={onConfirm}
            onCancel={() => {
                closeDialog();
            }}
            maxWidth="sm"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.launch}
            open={isOpen}
            closeDialog={closeDialog}
            id="bulk-push-gps"
            onClose={() => null}
            dataTestId="bulk-push-gps"
            allowConfirmAdditionalButton={
                hasTaskPermission && noLoadingAndNoError && approved
            }
            additionalButton
            additionalMessage={MESSAGES.goToCurrentTask}
            onAdditionalButtonClick={onConfirmAndSeeTask}
        >
            {isLoadingCheckResult ? (
                <LoadingSpinner absolute />
            ) : (
                <Grid container spacing={4} alignItems="center">
                    <Grid item xs={12}>
                        <Typography variant="subtitle1">
                            {isError ? (
                                <WarningMessage
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
                                    orgUnitCount:
                                        selection.selectCount -
                                        (checkBulkGpsPush?.warning_no_location
                                            ?.length ?? 0),
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
                                <WarningMessage
                                    message={formatMessage(
                                        MESSAGES.approveAllWarningsMessage,
                                    )}
                                />
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            )}
        </ConfirmCancelModal>
    );
};

const pushGpsModal = makeFullModal(PushGpsDialogComponent, PushGpsModalButton);

export { pushGpsModal as PushGpsModalComponent };
