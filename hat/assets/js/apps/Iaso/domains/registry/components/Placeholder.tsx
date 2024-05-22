import React, { FunctionComponent } from 'react';

import { Box, Grid, Skeleton } from '@mui/material';
import { HEIGHT } from '../config';

export const Placeholder: FunctionComponent = () => {
    return (
        <Box mt={2} width="100%">
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Skeleton
                        variant="rectangular"
                        width="100%"
                        height={HEIGHT}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <Skeleton
                        variant="rectangular"
                        width="100%"
                        height={HEIGHT}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Skeleton
                        variant="rectangular"
                        width="100%"
                        height="15vh"
                    />
                </Grid>
            </Grid>
        </Box>
    );
};
