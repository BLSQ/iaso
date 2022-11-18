import React, { FunctionComponent } from 'react';
import { Link } from 'react-router';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { Tooltip, makeStyles } from '@material-ui/core';
import HelpIcon from '@material-ui/icons/Help';
import { WHO_AFRO_PROCEDURE } from '../constants';
import MESSAGES from '../../../constants/messages';

const useStyles = makeStyles(theme => ({
    icon: {
        color: theme.palette.primary.main,
    },
}));

export const LinkToProcedure: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    return (
        <Tooltip title={formatMessage(MESSAGES.seeProcedure)}>
            <Link href={WHO_AFRO_PROCEDURE} target="_blank">
                <HelpIcon className={classes.icon} />
            </Link>
        </Tooltip>
    );
};
