import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { CsvButton } from '../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/CsvButton';
import { userHasPermission } from '../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';
import { useCurrentUser } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { CreateCampaignModal } from '../MainDialog/CreateCampaignModal';

const useStyles = makeStyles(theme => {
    return {
        marginBottom: { marginBottom: theme.spacing(0) },
    };
});

type Props = { exportToCSV: string };

export const DashboardButtons: FunctionComponent<Props> = ({ exportToCSV }) => {
    const currentUser = useCurrentUser();
    const classes: Record<string, string> = useStyles();
    const isUserAdmin = userHasPermission('iaso_polio_config', currentUser);
    return (
        <Grid
            container
            className={classes.marginBottom}
            spacing={2}
            justifyContent="flex-end"
            alignItems="center"
        >
            {isUserAdmin && (
                <Box mr={2}>
                    <CreateCampaignModal />
                </Box>
            )}
            <CsvButton csvUrl={exportToCSV} />
        </Grid>
    );
};
