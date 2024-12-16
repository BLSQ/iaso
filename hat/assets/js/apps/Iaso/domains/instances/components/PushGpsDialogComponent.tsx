import React, { FunctionComponent, useState } from 'react';
import { Button, Grid, Typography } from '@mui/material';
import { LinkWithLocation, useSafeIntl } from 'bluesquare-components';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import MESSAGES from '../messages';
import { createExportRequest } from '../actions';
import { Instance } from '../types/instance';
import { Selection } from '../../orgUnits/types/selection';

type Props = {
    getFilters: () => void;
    renderTrigger: (openDialog: boolean) => void;
    selection: Selection<Instance>;
};
const PushGpsDialogComponent: FunctionComponent<Props> = ({
    getFilters,
    renderTrigger,
    selection,
}) => {
    const [forceExport, setForceExport] = useState(false);
    const [approveOrgUnitHasGps, setApproveOrgUnitHasGps] =
        useState<boolean>(false);
    const [approveSubmissionNoHasGps, setApproveSubmissionNoHasGps] =
        useState<boolean>(false);
    const onConfirm = closeDialog => {
        const filterParams = getFilters();
        createExportRequest({ forceExport, ...filterParams }, selection).then(
            () => closeDialog(),
        );
    };
    const onClosed = () => {
        setForceExport(false);
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
                        {formatMessage(MESSAGES.pushGpsWarningMessage, {
                            submissionCount: 5,
                            orgUnitCount: 10,
                        })}
                    </Typography>
                </Grid>
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
                                {formatMessage(MESSAGES.noGpsForSomeInstaces)}
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
                    <Grid item xs={2} display="flex" justifyContent="flex-end">
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
                    <Grid item xs={2} display="flex" justifyContent="flex-end">
                        <Button
                            data-test="search-button"
                            variant="outlined"
                            color={approveOrgUnitHasGps ? 'primary' : 'warning'}
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
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};
export default PushGpsDialogComponent;
