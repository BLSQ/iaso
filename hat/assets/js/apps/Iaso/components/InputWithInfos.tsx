import React, { FunctionComponent, ReactNode } from 'react';

import { Tooltip, Grid, Box, useTheme } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';

type Props = {
    infos: string;
    children: ReactNode;
};

export const InputWithInfos: FunctionComponent<Props> = ({
    infos,
    children,
}) => {
    const theme = useTheme();
    return (
        <Grid container spacing={1}>
            <Grid item xs={11}>
                {children}
            </Grid>
            <Grid item xs={1}>
                <Tooltip title={infos} arrow>
                    <Box
                        position="relative"
                        top={theme.spacing(4)}
                        display="flex"
                        justifyContent="center"
                    >
                        <InfoIcon
                            color="primary"
                            style={{ cursor: 'pointer' }}
                        />
                    </Box>
                </Tooltip>
            </Grid>
        </Grid>
    );
};
