import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import Add from '@mui/icons-material/Add';
import { CsvButton } from '../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/CsvButton';
import { userHasPermission } from '../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';
import { useCurrentUser } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { commonStyles, LinkButton, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../constants/messages';
import { baseUrls } from '../../../constants/urls';

const useStyles = makeStyles(theme => {
    return {
        ...commonStyles(theme),
        marginBottom: { marginBottom: theme.spacing(0) },
    };
});

type Props = { exportToCSV: string };

export const DashboardButtons: FunctionComponent<Props> = ({ exportToCSV }) => {
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
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
                    <LinkButton
                        buttonClassName={classes.marginLeft}
                        variant="contained"
                        color="primary"
                        size="medium"
                        target="_self"
                        to={`/${baseUrls.campaignDetails}/`}
                    >
                        <Add className={classes.buttonIcon} />
                        {formatMessage(MESSAGES.create)}
                    </LinkButton>
                </Box>
            )}
            <CsvButton csvUrl={exportToCSV} />
        </Grid>
    );
};
