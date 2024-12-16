import React, { FunctionComponent } from 'react';
import { Box, Grid, Typography } from '@mui/material';
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
    const [forceExport, setForceExport] = React.useState(false);
    const onConfirm = closeDialog => {
        const filterParams = getFilters();
        createExportRequest({ forceExport, ...filterParams }, selection).then(
            () => closeDialog(),
        );
    };
    const onClosed = () => {
        setForceExport(false);
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
            <Grid
                container
                spacing={4}
                alignItems="center" // Centers vertically
            >
                <Grid item xs={12}>
                    <Typography variant="h6">
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
                    <Grid item xs={6}>
                        <Typography
                            variant="subtitle2"
                            component="ul"
                            sx={{ marginLeft: 2 }}
                        >
                            <Typography component="li">
                                Some instances don't have locations. Nothing
                                will be applied for those OrgUnits.
                            </Typography>
                        </Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Box>
                            <LinkWithLocation to="url">
                                See all
                            </LinkWithLocation>
                        </Box>
                    </Grid>
                    <Grid item xs={3}>
                        <Box>
                            <LinkWithLocation to="url">
                                See all
                            </LinkWithLocation>
                        </Box>
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
                    <Grid item xs={6}>
                        <Typography component="ul" sx={{ marginLeft: 2 }}>
                            <Typography component="li">
                                Some OrgUnits already have GPS coordinates. Do
                                you want to proceed and overwrite them?
                            </Typography>
                        </Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Box>
                            <LinkWithLocation to="url">
                                See all
                            </LinkWithLocation>
                        </Box>
                    </Grid>
                    <Grid item xs={3}>
                        <Box>
                            <LinkWithLocation to="url">
                                See all
                            </LinkWithLocation>
                        </Box>
                    </Grid>
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};
export default PushGpsDialogComponent;
