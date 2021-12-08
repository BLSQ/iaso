import React from 'react';
import { Grid, Paper, Box, Typography } from '@material-ui/core';
import { array, string } from 'prop-types';
import { useStyles } from './styles';

const convertWidth = width => {
    if (width === 'xs') return '100px';
    if (width === 'sm') return '120px';
    if (width === 'md') return '150px';
    if (width === 'lg') return '180px';
    if (width === 'xl') return '200px';
    return '100px';
};

export const MapLegend = ({ title, legendItems, width }) => {
    const classes = useStyles();
    return (
        <Paper elevation={1} style={{ width: convertWidth(width) }}>
            <Box p={2}>
                <Typography
                    variant="subtitle1"
                    className={classes.mapLegendTitle}
                >
                    {title}
                </Typography>
                {legendItems.map((legendItem, i) => (
                    <Grid
                        container
                        spacing={1}
                        key={`${title}${i}${legendItem.value}`}
                    >
                        <Grid
                            item
                            sm={width === 'xs' ? 6 : 4}
                            container
                            justifyContent="flex-start"
                        >
                            <span
                                className={classes.roundColor}
                                style={{ backgroundColor: legendItem.color }}
                            />
                        </Grid>
                        <Grid
                            item
                            sm={width === 'xs' ? 6 : 8}
                            container
                            justifyContent="flex-end"
                            alignItems="center"
                        >
                            {legendItem.label}
                        </Grid>
                    </Grid>
                ))}
            </Box>
        </Paper>
    );
};

MapLegend.propTypes = {
    title: string.isRequired,
    legendItems: array.isRequired,
    width: string,
};
MapLegend.defaultProps = {
    width: 'small',
};
