import React, { FunctionComponent, useState } from 'react';
import { Button, Grid, Typography } from '@mui/material';
import { LinkWithLocation, useSafeIntl } from 'bluesquare-components';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import MESSAGES from '../messages';
import { Instance } from '../types/instance';
import { Selection } from '../../orgUnits/types/selection';
import { useGetCheckBulkGpsPush } from '../hooks/useGetCheckBulkGpsPush';

type Props = {
    renderTrigger: (openDialog: boolean) => void;
    selection: Selection<Instance>;
};
const PushGpsDialogComponent: FunctionComponent<Props> = ({
    renderTrigger,
    selection,
}) => {
    const [approveOrgUnitHasGps, setApproveOrgUnitHasGps] =
        useState<boolean>(false);
    const [approveSubmissionNoHasGps, setApproveSubmissionNoHasGps] =
        useState<boolean>(false);
    const onConfirm = closeDialog => {
        return null;
    };

    const { data: checkBulkGpsPush, isFetching: isLoadingCheckBulkGpsPush } =
        useGetCheckBulkGpsPush({
            selected_ids: selection.selectedItems
                .map(item => item.id)
                .join(','),
            select_all: selection.selectAll,
            unselected_ids: selection.unSelectedItems
                .map(item => item.id)
                .join(','),
        });

    const onClosed = () => {
        return null;
    };

    const onApprove = type => {
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
    };
    let title = MESSAGES.export;
    if (selection) {
        title = {
            ...MESSAGES.pushGpsToOrgUnits,
            values: {
                count: selection.selectCount,
            },
        };
    }
    const { formatMessage } = useSafeIntl();
    return (
        // @ts-ignore
        <ConfirmCancelDialogComponent
            renderTrigger={({ openDialog }) => renderTrigger(openDialog)}
            titleMessage={title}
            onConfirm={onConfirm}
            confirmMessage={MESSAGES.launch}
            onClosed={onClosed}
            cancelMessage={MESSAGES.cancel}
            maxWidth="sm"
            additionalButton
            additionalMessage={MESSAGES.goToCurrentTask}
            onAdditionalButtonClick={onConfirm}
            allowConfimAdditionalButton
        >
            <Grid container spacing={4} alignItems="center">
                <Grid item xs={12}>
                    <Typography variant="subtitle1">
                        {(checkBulkGpsPush?.error_ids?.length ?? 0) <= 0
                            ? formatMessage(MESSAGES.pushGpsWarningMessage, {
                                  submissionCount: selection.selectCount,
                                  orgUnitCount: selection.selectCount,
                              })
                            : formatMessage(
                                  MESSAGES.multipleInstancesOneOrgUnitWarningMessage,
                              )}
                    </Typography>
                </Grid>
                {(checkBulkGpsPush?.warning_no_location?.length ?? 0) > 0 &&
                    (checkBulkGpsPush?.error_ids?.length ?? 0) <= 0 && (
                        <Grid
                            item
                            xs={12}
                            container
                            spacing={2}
                            alignItems="center"
                            direction="row"
                        >
                            <Grid item xs={8}>
                                <Typography
                                    component="ul"
                                    sx={{ color: 'warning.main' }}
                                >
                                    <Typography component="li">
                                        {formatMessage(
                                            MESSAGES.noGpsForSomeInstaces,
                                        )}
                                    </Typography>
                                </Typography>
                            </Grid>
                            <Grid
                                item
                                xs={2}
                                display="flex"
                                justifyContent="flex-start"
                            >
                                <LinkWithLocation to="url">
                                    {formatMessage(MESSAGES.seeAll)}
                                </LinkWithLocation>
                            </Grid>
                            <Grid
                                item
                                xs={2}
                                display="flex"
                                justifyContent="flex-end"
                            >
                                <Button
                                    data-test="search-button"
                                    variant="outlined"
                                    color={
                                        approveSubmissionNoHasGps
                                            ? 'primary'
                                            : 'warning'
                                    }
                                    onClick={() => onApprove('instanceNoGps')}
                                >
                                    {formatMessage(
                                        approveSubmissionNoHasGps
                                            ? MESSAGES.approved
                                            : MESSAGES.approve,
                                    )}
                                </Button>
                            </Grid>
                        </Grid>
                    )}
                {(checkBulkGpsPush?.warning_overwrite?.length ?? 0) > 0 &&
                    (checkBulkGpsPush?.error_ids?.length ?? 0) <= 0 && (
                        <Grid
                            item
                            xs={12}
                            container
                            spacing={2}
                            alignItems="center"
                            direction="row"
                        >
                            <Grid item xs={8}>
                                <Typography
                                    component="ul"
                                    sx={{ color: 'warning.main' }}
                                >
                                    <Typography component="li">
                                        {formatMessage(
                                            MESSAGES.someOrgUnitsHasAlreadyGps,
                                        )}
                                    </Typography>
                                </Typography>
                            </Grid>
                            <Grid
                                item
                                xs={2}
                                display="flex"
                                justifyContent="flex-start"
                            >
                                <LinkWithLocation to="url">
                                    {formatMessage(MESSAGES.seeAll)}
                                </LinkWithLocation>
                            </Grid>
                            <Grid
                                item
                                xs={2}
                                display="flex"
                                justifyContent="flex-end"
                            >
                                <Button
                                    data-test="search-button"
                                    variant="outlined"
                                    color={
                                        approveOrgUnitHasGps
                                            ? 'primary'
                                            : 'warning'
                                    }
                                    onClick={() => onApprove('orgUnitHasGps')}
                                >
                                    {formatMessage(
                                        approveOrgUnitHasGps
                                            ? MESSAGES.approved
                                            : MESSAGES.approve,
                                    )}
                                </Button>
                            </Grid>
                        </Grid>
                    )}
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};
export default PushGpsDialogComponent;
