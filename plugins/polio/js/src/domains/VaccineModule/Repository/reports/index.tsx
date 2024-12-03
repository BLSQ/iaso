import { Box } from '@mui/material';

import React, { FunctionComponent, useMemo } from 'react';
import { getPrefixedParams } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/common';
import { VaccineRepositoryParams } from '../types';

type Props = {
    params: VaccineRepositoryParams;
};

export const Reports: FunctionComponent<Props> = ({ params }) => {
    const reportParams = useMemo(
        () => getPrefixedParams('report', params),
        [params],
    );
    console.log('reportParams', reportParams);
    return <Box>Reports</Box>;
};
