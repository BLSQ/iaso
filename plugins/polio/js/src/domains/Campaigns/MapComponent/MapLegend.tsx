/* eslint-disable react/no-array-index-key */
import React, { FunctionComponent } from 'react';
import { Grid, Paper, Box, Typography } from '@mui/material';
import { convertWidth } from '../../../utils/index';
import { LqasImLegendItem } from '../../LQAS-IM/LQAS/utils';
import { useStyles } from './styles';

type Props = {
    title: string;
    legendItems: LqasImLegendItem[];
    width?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    name: string;
};

export const MapLegend: FunctionComponent<Props> = ({
    title,
    legendItems,
    width = 'sm',
    name,
}) => {
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
                        <Box
                            py={1}
                            key={`${title}${i}${legendItem.label}${legendItem.value}-${name}`}
                        >
                            <Grid container spacing={1}>
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
