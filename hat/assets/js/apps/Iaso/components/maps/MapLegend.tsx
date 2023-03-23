import React, { FunctionComponent, ReactNode } from 'react';
import { Paper, Typography, makeStyles, Box } from '@material-ui/core';

// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';

import { IntlMessage } from '../../types/intl';

const useStyles = makeStyles(theme => ({
    root: {
        position: 'absolute', // assuming you have a parent relative
        zIndex: 500,
    },
    mapLegendTitle: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    roundColor: {
        borderRadius: theme.spacing(2),
        height: theme.spacing(2),
        width: theme.spacing(2),
        display: 'inline-block',
        marginRight: theme.spacing(1),
    },
    mapLegendLabel: {
        textAlign: 'right',
        display: 'inline-block',
        verticalAlign: 'top',
    },
}));

export type Legend = {
    value: string;
    label: string;
    color: string; // has to be an hexa color
};

type Props = {
    titleMessage?: IntlMessage;
    options?: Array<Legend> | undefined;
    content?: ReactNode | undefined;
    top?: number | 'auto';
    right?: number | 'auto';
    left?: number | 'auto';
    bottom?: number | 'auto';
    width?: number | 'auto';
    padding?: number;
};

export const MapLegend: FunctionComponent<Props> = ({
    titleMessage,
    options,
    content,
    top,
    right,
    left,
    bottom,
    width,
    padding,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Paper
            elevation={1}
            className={classes.root}
            style={{ top, left, right, bottom, width }}
        >
            <Box p={padding}>
                {titleMessage && (
                    <Typography
                        variant="subtitle1"
                        className={classes.mapLegendTitle}
                    >
                        {formatMessage(titleMessage)}
                    </Typography>
                )}
                {content}
                {options &&
                    options.map((o, i) => (
                        <Box
                            key={o.value}
                            mb={i + 1 === options.length ? 0 : 1}
                        >
                            <span
                                className={classes.roundColor}
                                style={{ backgroundColor: o.color }}
                            />

                            <span className={classes.mapLegendLabel}>
                                {o.label}
                            </span>
                        </Box>
                    ))}
            </Box>
        </Paper>
    );
};

MapLegend.defaultProps = {
    top: 16,
    right: 16,
    left: 'auto',
    bottom: 'auto',
    width: 200,
    padding: 2,
};
