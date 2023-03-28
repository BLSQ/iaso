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

import classNames from 'classnames';
import { useGetCampaignFieldLabel } from '../../hooks/useGetCampaignFieldLabel';

type RowProps = {
    fieldKey?: string;
    value: any;
    cellWithMargin?: boolean;
};
const useStyles = makeStyles((theme: Theme) => ({
    ...commonStyles(theme),
    tableCell: {
        ...commonStyles(theme).tableCell,
        padding: '0 ! important',
    },
    tableCellLabel: {
        ...commonStyles(theme).tableCell,
        verticalAlign: 'middle',
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
    noMargin: {
        margin: 0,
        padding: 0,
    },
}));

const redirectToUrl = url => {
    window.open(url);
};

const truncate = (string, limit) => {
    return `${string.slice(0, limit)}...`;
};

export const Row: FunctionComponent<RowProps> = ({
    fieldKey,
    value,
    cellWithMargin = true,
}) => {
    const classes: Record<string, string> = useStyles();
    const getLabel = useGetCampaignFieldLabel();
    const regex = '^(http|https):\\/\\/';
    return (
        <TableRow>
            {fieldKey && (
                <TableCell className={classes.tableCellLabel} width={300}>
                    {getLabel(fieldKey)}
                </TableCell>
            )}
            <TableCell
                className={classNames(
                    classes.tableCell,
                    !cellWithMargin && classes.noMargin,
                )}
            >
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
