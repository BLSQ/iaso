import { useCallback, useMemo, useState } from 'react';
import { Table, LoadingSpinner } from 'bluesquare-components';
import 'react-table/react-table.css';

import { Box } from '@material-ui/core';

import { Page } from './Page';
import { useGetCampaigns } from '../hooks/useGetCampaigns';
import { useStyles } from '../styles/theme';
import { useGetPages } from '../hooks/useGetPages';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;
const DEFAULT_ORDER = 'name';

export const Pages = () => {
    const [page, setPage] = useState(parseInt(DEFAULT_PAGE, 10));
    const [pageSize, setPageSize] = useState(parseInt(DEFAULT_PAGE_SIZE, 10));
    const classes = useStyles();

    const { query } = useGetPages({
        page,
        pageSize,
    });

    const { data: pages = [], status } = query;

    const columns = useMemo(
        () => [
            {
                Header: 'Name',
                accessor: 'name',
                Cell: settings => {
                    return <sspan>{settings.original.name}</sspan>;
                },
            },
        ],
        [],
    );

    // The naming is aligned with the names in Table
    const onTableParamsChange = useCallback(
        (baseUrl, newParams) => {
            if (newParams.page !== page) {
                setPage(newParams.page);
            }
            if (newParams.pageSize !== pageSize) {
                setPageSize(newParams.pageSize);
            }
        },
        [page, pageSize],
    );

    const tableParams = useMemo(() => {
        return {
            pageSize,
            page,
        };
    }, [pageSize, page]);

    return (
        <Page title={'Pages'}>
            <Box className={classes.containerFullHeightNoTabPadded}>
                {status === 'loading' && <LoadingSpinner />}
                {status === 'success' && (
                    <Table
                        params={tableParams}
                        count={pages.count}
                        pages={Math.ceil(pages.count / pageSize)}
                        baseUrl={'/polio'}
                        redirectTo={onTableParamsChange}
                        columns={columns}
                        data={pages.results}
                        watchToRender={tableParams}
                    />
                )}
            </Box>
        </Page>
    );
};
