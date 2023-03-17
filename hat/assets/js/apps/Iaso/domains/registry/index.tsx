import React, { FunctionComponent } from 'react';
import { makeStyles, Box } from '@material-ui/core';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

// type Props = {
//     params: PlanningParams;
// };
// const baseUrl = baseUrls.registry;
export const Registry: FunctionComponent = () => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />

            <Box className={classes.containerFullHeightNoTabPadded}>
                REGISTRY
            </Box>
        </>
    );
};
