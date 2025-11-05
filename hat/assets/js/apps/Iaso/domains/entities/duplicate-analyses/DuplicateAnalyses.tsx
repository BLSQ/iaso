import React, { FC } from 'react';
import { Box, useTheme } from '@mui/material';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { PaginationParams } from 'Iaso/types/general';
import { DuplicatesGETParams } from '../duplicates/hooks/api/useGetDuplicates';
import MESSAGES from '../duplicates/messages';
import { DuplicateAnalysesFilters } from './DuplicateAnalysesFilters';

type Params = PaginationParams & DuplicatesGETParams;

const baseUrl = baseUrls.entityDuplicateAnalyses;

export const DuplicateAnalyses: FC = () => {
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();

    const params = useParamsObject(baseUrl) as unknown as Params;

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.duplicateAnalyses)}
                displayBackButton={false}
            />
            <Box sx={commonStyles(theme).containerFullHeightNoTabPadded}>
                <DuplicateAnalysesFilters params={params} />
            </Box>
        </>
    );
};
