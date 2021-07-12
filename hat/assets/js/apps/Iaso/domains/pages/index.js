import React, { useCallback, useMemo, useState } from 'react';
import {
    Table,
    LoadingSpinner,
    useSafeIntl,
    commonStyles,
    IconButton as IconButtonComponent,
    ColumnText,
} from 'bluesquare-components';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Box } from '@material-ui/core';
import moment from 'moment';
import AddIcon from '@material-ui/icons/Add';
import Grid from '@material-ui/core/Grid';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from '../forms/messages';
import { useGetPages } from './useGetPages';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const handleClickEditRow = id => alert('open modal');
const handleClickCreateButton = () => alert('open modal');

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
            {
                Header: 'Last update',
                accessor: 'updated_at',
                Cell: settings => {
                    return (
                        <ColumnText
                            text={moment(settings.original.updated_at).format(
                                'DD/MM/YYYY HH:mm',
                            )}
                        />
                    );
                },
            },
            {
                Header: 'Actions',
                Cell: settings => {
                    return (
                        <>
                            <IconButtonComponent
                                icon="remove-red-eye"
                                tooltipMessage={MESSAGES.viewPage}
                                onClick={() =>
                                    handleClickEditRow(settings.original.id)
                                }
                            />
                            <IconButtonComponent
                                icon="edit"
                                tooltipMessage={MESSAGES.edit}
                                onClick={() =>
                                    handleClickEditRow(settings.original.id)
                                }
                            />
                        </>
                    );
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
                <PageActions>
                    <PageAction
                        icon={AddIcon}
                        onClick={handleClickCreateButton}
                    >
                        Create
                    </PageAction>
                </PageActions>
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

const PageActions = ({ children }) => {
    const classes = useStyles();

    return (
        <Grid
            container
            className={classes.pageActions}
            spacing={4}
            justify="flex-end"
            alignItems="center"
        >
            <Grid item xs={4} container justify="flex-end" alignItems="center">
                {children}
            </Grid>
        </Grid>
    );
};

const PageAction = ({ icon: Icon, onClick, children }) => {
    const classes = useStyles();

    return (
        <Button
            variant="contained"
            color="primary"
            onClick={onClick}
            className={classes.pageAction}
        >
            <Icon className={classes.buttonIcon} />
            {children}
        </Button>
    );
};

export default Pages;
