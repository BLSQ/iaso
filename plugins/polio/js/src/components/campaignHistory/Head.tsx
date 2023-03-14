/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { useSafeIntl, commonStyles } from 'bluesquare-components';

import {
    TableHead,
    TableRow,
    TableCell,
    makeStyles,
    Theme,
} from '@material-ui/core';

import MESSAGES from '../../constants/messages';

const useStyles = makeStyles((theme: Theme) => ({
    ...commonStyles(theme),
    tableCellHead: {
        fontWeight: 'bold',
    },
}));

export const Head: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();

    return (
        <TableHead>
            <TableRow>
                <TableCell width={150} className={classes.tableCellHead}>
                    {formatMessage(MESSAGES.label)}
                </TableCell>
                <TableCell className={classes.tableCellHead}>
                    {formatMessage(MESSAGES.value)}
                </TableCell>
            </TableRow>
        </TableHead>
    );
};
