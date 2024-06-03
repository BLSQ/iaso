import React, { FunctionComponent } from 'react';

import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { useSafeIntl, commonStyles } from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import { useRunsTableColumns } from './hooks/useRunTableColumns';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';

import {
    useGetAlgorithmRuns,
    tableDefaults,
} from './hooks/api/useGetAlgorithmRuns';
import { AlgoRunsFilters } from './AlgoRunsFilters';
import { AddAlgorithmRun } from './Modal/AddAlgorithmRun';
import MESSAGES from '../links/messages';
import { useLaunchAlgorithmRun } from './hooks/api/useLaunchAlgorithmRun';

const baseUrl = baseUrls.algos;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

export const Runs: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as {
        accountId?: string;
        page?: string;
        pageSize?: string;
        order?: string;
        searchActive?: string;
    };
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();

    const { data, isFetching } = useGetAlgorithmRuns({
        params,
        enabled: Boolean(params.searchActive),
    });
    // declaring this here to ahev an easy access to isSaving
    const { mutateAsync: launchRun, isLoading: isSaving } =
        useLaunchAlgorithmRun();

    const tableColumns = useRunsTableColumns();
    const loading = isFetching || isSaving;

    return (
        <>
            <TopBar title={formatMessage(MESSAGES.runsTitle)} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <AlgoRunsFilters baseUrl={baseUrl} params={params} />
                <Box
                    display="inline-flex"
                    justifyContent="flex-end"
                    mt={2}
                    style={{ width: '100%' }}
                >
                    <AddAlgorithmRun
                        launchRun={launchRun}
                        isSaving={isSaving}
                        iconProps={{}}
                    />
                </Box>
                <TableWithDeepLink
                    baseUrl={baseUrl}
                    params={params}
                    columns={tableColumns}
                    defaultSorted={[{ id: 'ended_at', desc: true }]}
                    data={data?.runs ?? []}
                    count={data?.count ?? 0}
                    pages={data?.pages ?? 0}
                    extraProps={{
                        defaultPageSize: data?.limit ?? tableDefaults.limit,
                        loading,
                    }}
                />
            </Box>
        </>
    );
};
