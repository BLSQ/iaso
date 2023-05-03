import React, { FunctionComponent } from 'react';
import { Link } from 'react-router';
import { useSafeIntl } from 'bluesquare-components';
import { Tooltip, makeStyles } from '@material-ui/core';
import HelpIcon from '@material-ui/icons/Help';
import { BUDGET_PROCEDURE_SCHEMA } from '../constants';
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
            <Link href={BUDGET_PROCEDURE_SCHEMA} target="_blank">
                <HelpIcon className={classes.icon} />
            </Link>
        </Tooltip>
    );
};
