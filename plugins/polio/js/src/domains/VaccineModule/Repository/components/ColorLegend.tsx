import { Box, Grid, Typography } from '@mui/material';
import React, { FunctionComponent } from 'react';

type Props = {
    legendItems: {
        label: string;
        color: string;
    }[];
};
const ColorLegend: FunctionComponent<Props> = ({ legendItems }) => {
    return (
        <Grid item xs={12} md={12} container justifyContent="flex-end">
            <Box display="flex" alignItems="center" sx={{ marginTop: 2 }}>
                {legendItems.map(item => (
                    <Box
                        key={item.color}
                        display="flex"
                        alignItems="center"
                        sx={{
                            '&:not(:last-child)': {
                                marginRight: 2,
                            },
                        }}
                    >
                        <Box
                            width={16}
                            height={16}
                            bgcolor={item.color}
                            marginRight={1}
                        />
                        <Typography variant="body2">{item.label}</Typography>
                    </Box>
                ))}
            </Box>
        </Grid>
    );
};

export default ColorLegend;
