import React, { FC, useMemo } from 'react';
import { Box, useTheme } from '@mui/material';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { RefreshButton } from 'Iaso/components/Buttons/RefreshButton';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { PaginationParams } from 'Iaso/types/general';
import {
    DuplicateAnalysesGETParams,
    useGetDuplicateAnalyses,
} from '../duplicates/hooks/api/useGetDuplicateAnalyses';
import { AnalysisModal } from '../duplicates/list/AnalysisModal';
import MESSAGES from '../duplicates/messages';
import { AnalysisList } from '../duplicates/types';
import { DuplicateAnalysesFilters } from './DuplicateAnalysesFilters';
import { useDuplicateAnalysesTableColumns } from './useDuplicateAnalysesTableColumns';

type Params = PaginationParams & DuplicateAnalysesGETParams;

const baseUrl = baseUrls.entityDuplicateAnalyses;
const defaultData = {
    results: [],
    pages: 1,
    count: 0,
};

export const DuplicateAnalyses: FC = () => {
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();
    const style = useMemo(() => commonStyles(theme), [theme]);
    const params = useParamsObject(baseUrl) as unknown as Params;
    const {
        data,
        isFetching: isFetchingAnalysis,
        refetch: setForceRefresh,
    } = useGetDuplicateAnalyses({ params });
    const columns = useDuplicateAnalysesTableColumns(setForceRefresh);

    const { results, pages, count } = (data as AnalysisList) ?? defaultData;

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.duplicateAnalyses)}
                displayBackButton={false}
            />
            <Box sx={style.containerFullHeightNoTabPadded}>
                <DuplicateAnalysesFilters params={params} />
                <Box display="flex" gap={2} justifyContent="flex-end">
                    <RefreshButton forceRefresh={setForceRefresh} />
                    <AnalysisModal iconProps={{}} onApply={setForceRefresh} />
                </Box>
                <Box sx={style.table}>
                    <TableWithDeepLink
                        marginTop={false}
                        data={results}
                        pages={pages}
                        // defaultSorted={defaultSorted}
                        columns={columns}
                        count={count ?? 0}
                        baseUrl={baseUrl}
                        params={params}
                        getObjectId={it => it.id}
                        expanded={{}}
                        extraProps={{
                            loading: isFetchingAnalysis,
                        }}
                    />
                </Box>
            </Box>
        </>
    );
};
