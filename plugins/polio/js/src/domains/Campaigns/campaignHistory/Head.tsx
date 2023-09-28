/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';

import { TableHead, TableRow, TableCell, makeStyles } from '@material-ui/core';

import MESSAGES from '../../../constants/messages';

const useStyles = makeStyles(() => ({
    tableCellHead: {
        fontWeight: 'bold',
    },
    tableCellHeadNoPadding: {
        fontWeight: 'bold',
        paddingLeft: 0,
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
                <TableCell className={classes.tableCellHeadNoPadding}>
                    {formatMessage(MESSAGES.value)}
                </TableCell>
            </TableRow>
        </TableHead>
    );
};
