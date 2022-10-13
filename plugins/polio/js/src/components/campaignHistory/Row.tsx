import React, { FunctionComponent } from 'react';
import {
    // @ts-ignore
    commonStyles,
} from 'bluesquare-components';

import { TableRow, TableCell, makeStyles, Theme } from '@material-ui/core';

import { useGetCampaignFieldLabel } from '../../hooks/useGetCampaignFieldLabel';

type RowProps = {
    fieldKey?: string;
    value: any;
};
const useStyles = makeStyles((theme: Theme) => ({
    ...commonStyles(theme),
    tableCellLabel: {
        ...commonStyles(theme).tableCell,
        verticalAlign: 'top',
    },
    value: {
        maxWidth: '300px',
    },
}));

export const Row: FunctionComponent<RowProps> = ({ fieldKey, value }) => {
    const classes: Record<string, string> = useStyles();
    const getLabel = useGetCampaignFieldLabel();
    return (
        <TableRow>
            {fieldKey && (
                <TableCell className={classes.tableCellLabel}>
                    {getLabel(fieldKey)}
                </TableCell>
            )}
            <TableCell className={classes.tableCell}>{value}</TableCell>
        </TableRow>
    );
};
