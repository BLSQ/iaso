import { Box, Grid } from '@mui/material';
import React, { FunctionComponent } from 'react';
import { ProductivityOption } from './ProductivityOption';
import { baseUrls } from '../../../../constants/urls';

const options = [
    { name: 'SUTOM', url: 'https://sutom.nocle.fr' },
    { name: 'Guess the game', url: 'https://guessthe.game' },
];

export const Productivity: FunctionComponent = () => {
    return (
        <Box style={{ width: '100%' }}>
            <Box style={{ width: '100%', fontSize: '48px' }} mb={30}>
                <Box
                    style={{
                        border: '2px solid #33FF00',
                        width: '50%',
                        margin: 'auto',
                    }}
                    py={4}
                >
                    CHOOSE YOUR DESTINY
                </Box>
            </Box>

            <Grid container justifyContent="space-evenly" spacing={2}>
                {options.map(option => (
                    <Grid item key={`${option.name}-${option.url}`}>
                        <Box>
                            <ProductivityOption
                                destinationName={option.name}
                                url={option.url}
                            />
                        </Box>
                    </Grid>
                ))}
                <Grid item key="backtoiaso">
                    <Box>
                        <ProductivityOption
                            destinationName="Back to Iaso"
                            url={`/dashboard/${baseUrls.home}`}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};
