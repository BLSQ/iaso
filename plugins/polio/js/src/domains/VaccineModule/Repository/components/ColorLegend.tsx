import React, { FunctionComponent } from 'react';
import { Box, Grid, Typography } from '@mui/material';

type Props = {
    legendItems: {
        label: string;
        color: string;
    }[];
};
const ColorLegend: FunctionComponent<Props> = ({ legendItems }) => {
    return (
        <Grid
            container
            size={{
                xs: 12,
                md: 12
            }}
            sx={{
                justifyContent: "flex-end"
            }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: 2
                }}>
                {legendItems.map(item => (
                    <Box
                        key={item.color}
                        sx={{
                            display: "flex",
                            alignItems: "center",

                            '&:not(:last-child)': {
                                marginRight: 2,
                            }
                        }}>
                        <Box
                            sx={{
                                width: 16,
                                height: 16,
                                bgcolor: item.color,
                                marginRight: 1
                            }} />
                        <Typography variant="body2">{item.label}</Typography>
                    </Box>
                ))}
            </Box>
        </Grid>
    );
};

export default ColorLegend;
