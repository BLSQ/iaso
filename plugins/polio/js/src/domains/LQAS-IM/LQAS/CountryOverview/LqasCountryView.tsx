import { Side } from 'plugins/polio/js/src/constants/types';
import React, { FunctionComponent } from 'react';
import { LqasUrlParams } from '../lqas';
import { LqasCountryFilter } from './LqasCountryFilter';
import { Box } from '@mui/material';

type Props = {
    side: Side;
    params: LqasUrlParams;
};

export const LqasCountryView: FunctionComponent<Props> = ({ side, params }) => {
    return (
        <Box>
            <LqasCountryFilter side={side} params={params} />
        </Box>
    );
};
