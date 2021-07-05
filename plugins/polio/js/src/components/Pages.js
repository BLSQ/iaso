import { useCallback, useMemo, useState } from 'react';
import { Table, LoadingSpinner } from 'bluesquare-components';
import 'react-table/react-table.css';

import { Box } from '@material-ui/core';

import { Page } from './Page';
import { useGetCampaigns } from '../hooks/useGetCampaigns';
import { useStyles } from '../styles/theme';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;
const DEFAULT_ORDER = 'name';

export const Pages = () => {
    const [page, setPage] = useState(parseInt(DEFAULT_PAGE, 10));
    const [pageSize, setPageSize] = useState(parseInt(DEFAULT_PAGE_SIZE, 10));
    const [order, setOrder] = useState(DEFAULT_ORDER);
    const classes = useStyles();

    const { query } = useGetCampaigns({
        page,
        pageSize,
        order,
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
            if (newParams.order !== order) {
                setOrder(newParams.order);
            }
        },
        [page, pageSize, order],
    );

    const tableParams = useMemo(() => {
        return {
            pageSize,
            page,
            order,
        };
    }, [pageSize, page, order]);

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
                        data={pages.result}
                        watchToRender={tableParams}
                    />
                )}
            </Box>
        </Page>
    );
};
