import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import {
    useSafeIntl,
    commonStyles,
    LoadingSpinner,
    Table,
} from 'bluesquare-components';
import { Box, Grid, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { useGetDataSource } from './hooks/useGetDataSources';
import { DataSource } from './types/dataSources';
import { DataSourceInfo } from './components/DataSourceInfo';
import WidgetPaper from '../../components/papers/WidgetPaperComponent';
import { useSourceVersionsTableColumns } from './config';
import {
    getSortedSourceVersions,
    handleSort,
    handleTableParamsChange,
    getTableParams,
    getTablePages,
} from './utils';
import { useGoBack } from '../../routing/hooks/useGoBack';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { baseUrls } from '../../constants/urls';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    titleRow: { fontWeight: 'bold' },
    fullWidth: { width: '100%' },
    infoPaper: { width: '100%', position: 'relative' },
    infoPaperBox: { minHeight: '100px' },
    test: { marginTop: '-70px' },
}));

export const Details: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.sourceDetails) as {
        sourceId?: string;
    };
    const goBack = useGoBack(baseUrls.sources);

    const classes: Record<string, string> = useStyles();
    const { sourceId } = params;
    const { formatMessage } = useSafeIntl();

    const {
        data: dataSource,
    }: {
        data?: DataSource;
        isLoading: boolean;
    } = useGetDataSource(sourceId);

    const [page, setPage] = useState<any>(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [sortBy, setSortBy] = useState('asc');
    const [sortFocus, setSortFocus] = useState('number');
    const dataForTable = useMemo(
        () => dataSource?.versions ?? [],
        [dataSource?.versions],
    );
    const columns = useSourceVersionsTableColumns(dataSource);
    const formatDataForTable = useCallback(
        (tableData, sortFunc) =>
            tableData
                .sort(sortFunc)
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [page, rowsPerPage],
    );

    const sortedSourceVersions = useMemo(() => {
        return getSortedSourceVersions(
            dataForTable,
            sortFocus,
            sortBy,
            formatDataForTable,
            formatMessage,
        );
    }, [dataForTable, sortFocus, sortBy, formatDataForTable, formatMessage]);

    const handleSortFunction = useCallback(
        focus => {
            handleSort(focus, sortFocus, sortBy, setSortFocus, setSortBy);
        },
        [sortBy, sortFocus],
    );

    const handleTableParamsChangeFunction = useCallback(
        tableParams => {
            handleTableParamsChange(
                tableParams,
                handleSortFunction,
                setRowsPerPage,
                setPage,
            );
        },
        [handleSortFunction],
    );

    const tableParams = useMemo(() => {
        return getTableParams(rowsPerPage, page);
    }, [page, rowsPerPage]);

    const pages = useMemo(() => {
        return getTablePages(dataForTable, rowsPerPage);
    }, [dataForTable, rowsPerPage]);

    return (
        <>
            <TopBar
                title={`${formatMessage(MESSAGES.dataSourceDetailsTitle)}: ${
                    dataSource?.name
                }`}
                displayBackButton
                goBack={() => goBack()}
            />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                <Grid container spacing={2}>
                    <Grid container item xs={6}>
                        <WidgetPaper
                            className={classes.infoPaper}
                            title={formatMessage(
                                MESSAGES.dataSourceInformationTitle,
                            )}
                        >
                            <Box className={classes.infoPaperBox}>
                                {!dataSource && <LoadingSpinner absolute />}
                                <DataSourceInfo dataSource={dataSource} />
                            </Box>
                        </WidgetPaper>
                    </Grid>
                </Grid>
                <Box mt={2}>
                    <WidgetPaper
                        className={classes.fullWidth}
                        title={formatMessage(MESSAGES.dataSourceVersionTitle)}
                    >
                        <Box className={classes.test}>
                            <Table
                                data={sortedSourceVersions}
                                // @ts-ignore
                                columns={columns}
                                params={tableParams}
                                pages={pages}
                                elevation={0}
                                count={dataSource?.versions.length ?? 0}
                                onTableParamsChange={
                                    handleTableParamsChangeFunction
                                }
                            />
                        </Box>
                    </WidgetPaper>
                    {dataSource?.versions.length === 0 && (
                        <Typography style={{ padding: 5 }}>
                            {formatMessage(MESSAGES.dataSourceNoVersion)}
                        </Typography>
                    )}
                </Box>
            </Box>
        </>
    );
};
