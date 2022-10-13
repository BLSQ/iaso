import React, { FunctionComponent } from 'react';
import {
    // @ts-ignore
    commonStyles,
} from 'bluesquare-components';

import { TableRow, TableCell, makeStyles, Theme } from '@material-ui/core';

import MESSAGES from '../../constants/messages';
import { useGetCampaignFieldLabel } from '../../hooks/useGetCampaignFieldLabel';

type RowProps = {
    fieldKey?: string;
    value: any;
};
const useStyles = makeStyles((theme: Theme) => ({
    ...commonStyles(theme),
}));

export const Row: FunctionComponent<RowProps> = ({ fieldKey, value }) => {
    const classes: Record<string, string> = useStyles();
    const getLabel = useGetCampaignFieldLabel();
    return (
        <TableRow>
            {fieldKey && (
                <TableCell width={150} className={classes.tableCell}>
                    {getLabel(fieldKey, MESSAGES)}
                </TableCell>
            )}

            <TableCell width={150} className={classes.tableCell}>
                {value}
            </TableCell>
        </TableRow>
    );
};
