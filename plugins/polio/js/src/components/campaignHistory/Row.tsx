import React, { FunctionComponent } from 'react';
import {
    // @ts-ignore
    commonStyles,
} from 'bluesquare-components';

import {
    TableRow,
    TableCell,
    makeStyles,
    Theme,
    Typography,
} from '@material-ui/core';

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
    link: {
        color: theme.palette.primary.main,
        textAlign: 'right',
        flex: '1',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'flex-start',
    },
}));

const redirectToUrl = url => {
    window.open(url);
};

const truncate = (string, limit) => {
    return `${string.slice(0, limit)}...`;
};

export const Row: FunctionComponent<RowProps> = ({ fieldKey, value }) => {
    const classes: Record<string, string> = useStyles();
    const getLabel = useGetCampaignFieldLabel();
    const regex = '^(http|https):\\/\\/';
    return (
        <TableRow className={classes.round}>
            {fieldKey && (
                <TableCell className={classes.tableCellLabel} width={150}>
                    {getLabel(fieldKey)}
                </TableCell>
            )}
            <TableCell className={classes.tableCell}>
                {typeof value === 'string' && value.match(regex) ? (
                    <Typography
                        className={classes.link}
                        onClick={() => redirectToUrl(value)}
                    >
                        {truncate(value, 35)}
                    </Typography>
                ) : (
                    value
                )}
            </TableCell>
        </TableRow>
    );
};
