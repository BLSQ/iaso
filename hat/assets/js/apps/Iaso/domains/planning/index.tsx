import React, { FunctionComponent } from 'react';
import { makeStyles, Box } from '@material-ui/core';
import {
    commonStyles,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { PlanningParams } from './types';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Props = {
    params: PlanningParams;
};

export const Planning: FunctionComponent<Props> = ({ params }) => {
    console.log('params', params);
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.title)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                {/* // Your code here */}
            </Box>
        </>
    );
};
