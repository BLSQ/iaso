import React, { FunctionComponent } from 'react';
// @ts-ignore
import { Box, useTheme } from '@material-ui/core';

import { MapLegend } from '../MapLegend';
import ClusterSwitchComponent from './ClusterSwitchComponent';

export type Tile = {
    maxZoom: number;
    url: string;
    attribution?: string;
};

// Please use this component in a relative box container containing the map

export const ClusterSwitchLegend: FunctionComponent = () => {
    const theme = useTheme();
    return (
        <MapLegend
            top="auto"
            bottom={theme.spacing(3)}
            width="auto"
            padding={1}
            content={
                <Box mr={-1}>
                    <ClusterSwitchComponent innerDrawerContent={false} />
                </Box>
            }
        />
    );
};
