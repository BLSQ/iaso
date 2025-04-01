import React, { FunctionComponent } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { Box, Grid, IconButton, Paper, Popper } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';

import { SxStyles } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../../../../constants/messages';
import { MappedCampaign, SubActivity } from '../types';

const styles: SxStyles = {
    popper: {
        zIndex: 500,
        width: 400,
        backgroundColor: 'white',
    },
    popperClose: {
        position: 'absolute',
        top: theme => theme.spacing(1),
        right: theme => theme.spacing(1),
    },
    editButton: {
        marginLeft: 'auto',
    },
};

type Props = {
    campaign: MappedCampaign;
    handleClose: () => void;
    open: boolean;
    anchorEl: HTMLElement | undefined;
    subactivity: SubActivity;
};

export const SubactivityPopper: FunctionComponent<Props> = ({
    campaign,
    handleClose,
    open,
    anchorEl,
    subactivity,
}) => {
    const { formatMessage } = useSafeIntl();
    // We don't want to show the edit button if there is no connected user
    const id = open
        ? `campaign-popover-${campaign.id}-${subactivity.id}`
        : undefined;

    return (
        <Popper id={id} open={open} anchorEl={anchorEl} sx={styles.popper}>
            <Paper elevation={1}>
                <Box pt={4} pb={2} pr={2} pl={2}>
                    <IconButton
                        onClick={() => handleClose()}
                        sx={styles.popperClose}
                        size="small"
                    >
                        <CloseIcon color="primary" />
                    </IconButton>
                    <Grid container spacing={1} mb={1}>
                        <Grid item sm={6} container justifyContent="flex-end">
                            {formatMessage(MESSAGES.subactivityName)}:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {subactivity.name}
                        </Grid>
                    </Grid>
                    <Grid container spacing={1} mb={1}>
                        <Grid item sm={6} container justifyContent="flex-end">
                            {formatMessage(MESSAGES.startDate)}:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {subactivity.start_date &&
                                subactivity.start_date.format('L')}
                        </Grid>
                    </Grid>
                    <Grid container spacing={1} mb={1}>
                        <Grid item sm={6} container justifyContent="flex-end">
                            {formatMessage(MESSAGES.endDate)}:
                        </Grid>
                        <Grid item sm={6} container justifyContent="flex-start">
                            {subactivity.end_date &&
                                subactivity.end_date.format('L')}
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        </Popper>
    );
};
