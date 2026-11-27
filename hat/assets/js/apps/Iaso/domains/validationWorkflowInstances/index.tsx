import React, { useCallback } from 'react';
import Box from '@mui/material/Box/Box';
import Paper from '@mui/material/Paper/Paper';
import Typography from '@mui/material/Typography';
import {
    getOrderArray,
    TableToolbar,
    UrlParams,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { TableWithDeepLink } from 'Iaso/components/tables/TableWithDeepLink';
import { baseUrls } from 'Iaso/constants/urls';
import { useValidationWorkflowInstanceSearchColumns } from 'Iaso/domains/validationWorkflowInstances/config';
import {
    useGetValidationWorkflowInstanceCounts,
    useGetValidationWorkflowInstanceSearch,
} from 'Iaso/domains/validationWorkflowInstances/hooks/useGetValidationWorkflowInstanceSearch';
import {
    ParamsWithAccountId,
    useParamsObject,
} from 'Iaso/routing/hooks/useParamsObject';
import { SxStyles } from 'Iaso/types/general';
import { QueueTiles } from './components/QueueTiles';
import { ValidationWorkflowInstanceSearchFilter } from './components/ValidationWorkflowInstanceSearchFilter';
import { DEFAULT_ORDER, DEFAULT_PAGE_SIZE, QUEUES } from './constants';
import MESSAGES from './messages';
import { ValidationQueue } from './types';
import { daysSince } from './utils';

const styles = {
    root: {
        backgroundColor: theme => theme.palette.primary.background,
        padding: 4,
    },
    tiles: {
        marginBottom: 2,
    },
    table: {
        marginTop: 2,
        // Header titles are centered by the table component and the column `align` only applies to the body cells:
        // align titles to the start, except the last column (actions) which stays centered
        '& thead th:not(:last-of-type)': {
            textAlign: 'start !important',
        },
    },
} satisfies SxStyles;

const baseUrl = baseUrls.validationWorkflowInstances;

export const ValidationWorkflowInstances = () => {
    const params: ParamsWithAccountId &
        Partial<UrlParams> & {
            queue?: string;
        } = useParamsObject(baseUrl);
    const { data, isFetching } = useGetValidationWorkflowInstanceSearch({
        params,
    });
    const { data: counts, isLoading: isLoadingCounts } =
        useGetValidationWorkflowInstanceCounts({ params });
    const columns = useValidationWorkflowInstanceSearchColumns();
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();

    const selectedQueue = QUEUES.includes(params.queue as ValidationQueue)
        ? (params.queue as ValidationQueue)
        : undefined;

    const handleQueueChange = useCallback(
        (queue?: ValidationQueue) => {
            const { queue: _previousQueue, ...otherParams } = params;
            redirectToReplace(baseUrl, {
                ...otherParams,
                ...(queue ? { queue } : {}),
                page: '1',
            });
        },
        [params, redirectToReplace],
    );

    return (
        <>
            <TopBar title={formatMessage(MESSAGES.title)} />
            <MainWrapper sx={styles.root}>
                <Box sx={styles.tiles}>
                    <QueueTiles
                        selectedQueue={selectedQueue}
                        counts={counts}
                        isLoading={isLoadingCounts}
                        onChange={handleQueueChange}
                    />
                </Box>
                <ValidationWorkflowInstanceSearchFilter params={params} />

                <Paper sx={styles.table}>
                    <TableToolbar
                        count={data?.count}
                        extraActions={
                            counts?.oldest_pending_since ? (
                                <Typography
                                    variant="body2"
                                    color="textSecondary"
                                    data-testid="oldest-waiting"
                                >
                                    {formatMessage(MESSAGES.oldestWaiting, {
                                        days: `${daysSince(counts.oldest_pending_since)}`,
                                    })}
                                </Typography>
                            ) : undefined
                        }
                    />
                    <TableWithDeepLink
                        marginTop={false}
                        elevation={0}
                        baseUrl={baseUrl}
                        defaultSorted={getOrderArray(DEFAULT_ORDER)}
                        columns={columns}
                        params={params}
                        data={data?.results ?? []}
                        count={data?.count}
                        showCount={false}
                        pages={data?.pages ?? 0}
                        extraProps={{
                            loading: isFetching,
                            defaultPageSize: data?.limit ?? DEFAULT_PAGE_SIZE,
                            // force a render when these change, to avoid a desync between params and url
                            ...params,
                        }}
                    />
                </Paper>
            </MainWrapper>
        </>
    );
};
