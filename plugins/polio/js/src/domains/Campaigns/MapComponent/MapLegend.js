import React from 'react';
import { Grid, Paper, Box, Typography } from '@mui/material';
import { array, oneOf, string } from 'prop-types';
import { useStyles } from './styles';
import { convertWidth } from '../../../utils/index.tsx';

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
                {legendItems.map((legendItem, i) => {
                    return (
                        <Box py={1}>
                            <Grid
                                container
                                spacing={1}
                                key={`${title}${i}${legendItem.label}${legendItem.value}`}
                            >
                                <Grid
                                    item
                                    sm={
                                        width === 'xs' || width === 'sm' ? 6 : 3
                                    }
                                    container
                                    justifyContent="flex-start"
                                >
                                    <span
                                        className={classes.roundColor}
                                        style={{
                                            backgroundImage:
                                                legendItem.background,
                                            backgroundColor: legendItem.color,
                                        }}
                                    />
                                </Grid>
                                <Grid
                                    item
                                    sm={
                                        width === 'xs' || width === 'sm' ? 6 : 9
                                    }
                                    container
                                    justifyContent="flex-end"
                                    alignItems="center"
                                >
                                    <div style={{ fontSize: '14px' }}>
                                        {legendItem.label}
                                    </div>
                                </Grid>
                            </Grid>
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
};

MapLegend.propTypes = {
    title: string.isRequired,
    legendItems: array.isRequired,
    width: oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
};
MapLegend.defaultProps = {
    width: 'sm',
};
