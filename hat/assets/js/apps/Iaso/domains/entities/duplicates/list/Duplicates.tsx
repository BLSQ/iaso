import React, { FunctionComponent } from 'react';
import { useSafeIntl, commonStyles } from 'bluesquare-components';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { PaginationParams } from '../../../../types/general';
import MESSAGES from '../messages';
import TopBar from '../../../../components/nav/TopBarComponent';
import {
    DuplicatesGETParams,
    useGetDuplicates,
} from '../hooks/api/useGetDuplicates';
import { TableWithDeepLink } from '../../../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../../../constants/urls';
import { DuplicatesFilters } from './DuplicatesFilters';
import { starsStyleForTable } from '../../../../components/stars/StarsComponent';
import { useDuplicationTableColumns } from './useDuplicationTableColumns';
import { DuplicatesList } from '../types';
import { AnalyseAction } from './AnalyseAction';
import { useGetLatestAnalysis } from '../hooks/api/analyzes';
import { useParamsObject } from '../../../../routing/hooks/useParamsObject';

type Params = PaginationParams & DuplicatesGETParams;

type Props = {
    params: Params;
};
const baseUrl = baseUrls.entityDuplicates;

const defaultSorted = [{ id: 'similarity_star', desc: true }];

const useStyles = makeStyles(theme => {
    return {
        ...commonStyles(theme),
        ...starsStyleForTable,
    };
});

export const Duplicates: FunctionComponent<Props> = () => {
    const params = useParamsObject(baseUrl) as PaginationParams &
        DuplicatesGETParams;
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const { data: latestAnalysis, isFetching: isFetchingLatestAnalysis } =
        useGetLatestAnalysis();
    const { data, isFetching } = useGetDuplicates({
        params,
        refresh: latestAnalysis?.finished_at,
    });
    const columns = useDuplicationTableColumns();
    const { results, pages, count } = (data as DuplicatesList) ?? {
        results: [],
        pages: 1,
        count: 0,
    };

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.duplicates)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <AnalyseAction
                    latestAnalysis={latestAnalysis}
                    isFetchingLatestAnalysis={isFetchingLatestAnalysis}
                />
                <DuplicatesFilters params={params} />
                <Box className={classes.table}>
                    {/* @ts-ignore */}
                    <TableWithDeepLink
                        marginTop={false}
                        data={results}
                        pages={pages}
                        defaultSorted={defaultSorted}
                        columns={columns}
                        count={count ?? 0}
                        baseUrl={baseUrl}
                        params={params}
                        extraProps={{
                            loading: isFetching,
                        }}
                    />
                </Box>
            </Box>
        </>
    );
};
