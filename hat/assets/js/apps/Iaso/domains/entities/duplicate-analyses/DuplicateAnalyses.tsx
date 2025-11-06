import React, { FC, useMemo } from 'react';
import { Box, useTheme } from '@mui/material';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { PaginationParams } from 'Iaso/types/general';
import {
    DuplicateAnalysesGETParams,
    useGetDuplicateAnalyses,
} from '../duplicates/hooks/api/useGetDuplicateAnalyses';
import MESSAGES from '../duplicates/messages';
import { AnalysisList } from '../duplicates/types';
import { DuplicateAnalysesFilters } from './DuplicateAnalysesFilters';
import { useDuplicateAnalysesTableColumns } from './useDuplicateAnalysesTableColumns';

type Params = PaginationParams & DuplicateAnalysesGETParams;

const baseUrl = baseUrls.entityDuplicateAnalyses;

export const DuplicateAnalyses: FC = () => {
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();
    const style = useMemo(() => commonStyles(theme), [theme]);
    const params = useParamsObject(baseUrl) as unknown as Params;
    const columns = useDuplicateAnalysesTableColumns();

    const { data, isFetching: isFetchingAnalysis } = useGetDuplicateAnalyses({
        params,
    });

    const { results, pages, count } = (data as AnalysisList) ?? {
        results: [],
        pages: 1,
        count: 0,
    };
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.duplicateAnalyses)}
                displayBackButton={false}
            />
            <Box sx={style.containerFullHeightNoTabPadded}>
                <DuplicateAnalysesFilters params={params} />
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
