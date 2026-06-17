import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { baseUrls } from '../../../../constants/urls';
import { ProductivityOption } from './ProductivityOption';

const options = [
    { name: 'SUTOM', url: 'https://sutom.nocle.fr' },
    { name: 'Guess the game', url: 'https://guessthe.game' },
];

export const Productivity: FunctionComponent = () => {
    return (
        <Box style={{ width: '100%' }}>
            <Box style={{ width: '100%', fontSize: '48px' }} sx={{
                mb: 30
            }}>
                <Box
                    style={{
                        border: '2px solid #33FF00',
                        width: '50%',
                        margin: 'auto',
                    }}
                    sx={{
                        py: 4
                    }}
                >
                    CHOOSE YOUR DESTINY
                </Box>
            </Box>
            <Grid container spacing={2} sx={{
                justifyContent: "space-evenly"
            }}>
                {options.map(option => (
                    <Grid key={`${option.name}-${option.url}`}>
                        <Box>
                            <ProductivityOption
                                destinationName={option.name}
                                url={option.url}
                            />
                        </Box>
                    </Grid>
                ))}
                <Grid key="backtoiaso">
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
