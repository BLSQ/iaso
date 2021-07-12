import React, { useCallback, useMemo, useState } from 'react';
import {
    Table,
    LoadingSpinner,
    useSafeIntl,
    commonStyles,
} from 'bluesquare-components';
import { makeStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from '../forms/messages';
import { useGetPages } from './useGetPages';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Pages = () => {
    const intl = useSafeIntl();
    const classes = useStyles();
    const [page, setPage] = useState(parseInt(DEFAULT_PAGE, 10));
    const [pageSize, setPageSize] = useState(parseInt(DEFAULT_PAGE_SIZE, 10));

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
                    return <span>{settings.original.name}</span>;
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
        <>
            <TopBar title={intl.formatMessage(MESSAGES.title)} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                {status === 'loading' && <LoadingSpinner />}
                {status === 'success' && (
                    <Table
                        params={tableParams}
                        count={pages.count}
                        pages={Math.ceil(pages.count / pageSize)}
                        baseUrl="/polio"
                        redirectTo={onTableParamsChange}
                        columns={columns}
                        data={pages.results}
                        watchToRender={tableParams}
                    />
                )}
            </Box>
        </>
    );
};

export default Pages;
