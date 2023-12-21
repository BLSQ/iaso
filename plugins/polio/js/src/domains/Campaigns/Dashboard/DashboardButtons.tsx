import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl, AddButton } from 'bluesquare-components';
import DownloadIcon from '@mui/icons-material//GetApp';
import { LinkButton } from '../../../components/Buttons/LinkButton';
import { userHasPermission } from '../../../../../../../hat/assets/js/apps/Iaso/domains/users/utils';
import { useCurrentUser } from '../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import MESSAGES from '../../../constants/messages';

const useStyles = makeStyles(theme => {
    return {
        marginBottom: { marginBottom: theme.spacing(0) },
    };
});

type Props = { handleClickCreateButton: () => void; exportToCSV: string };

export const DashboardButtons: FunctionComponent<Props> = ({
    handleClickCreateButton,
    exportToCSV,
}) => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const classes: Record<string, string> = useStyles();
    const isUserAdmin = userHasPermission('iaso_polio_config', currentUser);
    return (
        <Box mr={1}>
            <Grid
                container
                className={classes.marginBottom}
                spacing={2}
                justifyContent="flex-end"
                alignItems="center"
            >
                {isUserAdmin && (
                    <Box mr={2}>
                        <AddButton onClick={handleClickCreateButton}>
                            {formatMessage(MESSAGES.create)}
                        </AddButton>
                    </Box>
                )}
                <LinkButton icon={DownloadIcon} url={exportToCSV}>
                    {formatMessage(MESSAGES.csv)}
                </LinkButton>
            </Grid>
        </Box>
    );
};
