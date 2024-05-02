import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useDispatch } from 'react-redux';
import { useSafeIntl, commonStyles } from 'bluesquare-components';
import { Box, Grid, useTheme, Tabs, Tab, Paper } from '@mui/material';
import { makeStyles } from '@mui/styles';
import Color from 'color';

import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { warningSnackBar } from '../../constants/snackBars';
import {
    closeFixedSnackbar,
    enqueueSnackbar,
} from '../../redux/snackBarsReducer';
import {
    buildQueryString,
    useGetCompletenessStats,
} from './hooks/api/useGetCompletnessStats';
import { useGetCompletnessMapStats } from './hooks/api/useGetCompletnessMapStats';
import { useCompletenessStatsColumns } from './hooks/useCompletenessStatsColumns';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { MENU_HEIGHT_WITHOUT_TABS } from '../../constants/uiConstants';
import { CompletenessStatsFilters } from './CompletenessStatsFilters';
import { CsvButton } from '../../components/Buttons/CsvButton';
import { CompletenessRouterParams } from './types';
import { Map } from './components/Map';
import { useGetFormsOptions } from './hooks/api/useGetFormsOptions';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { useRedirectTo } from '../../routing/routing';

const baseUrl = baseUrls.completenessStats;
const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    container: {
        height: `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px)`,
        overflow: 'auto',
    },
    hiddenOpacity: {
        position: 'absolute',
        top: 0,
        left: -5000,
        zIndex: -10,
        opacity: 0,
    },
}));

const snackbarKey = 'completenessMapWarning';
export const CompletenessStats: FunctionComponent = () => {
    const classes: Record<string, string> = useStyles();
    const params = useParamsObject(
        baseUrls.completenessStats,
    ) as CompletenessRouterParams;

    const [tab, setTab] = useState<'list' | 'map'>(params.tab ?? 'list');
    const dispatch = useDispatch();
    const redirectTo = useRedirectTo();
    const { formatMessage } = useSafeIntl();
    const { data: completenessStats, isFetching } =
        useGetCompletenessStats(params);
    const { data: completenessMapStats, isFetching: isFetchingMapStats } =
        useGetCompletnessMapStats(params, tab === 'map');
    const columns = useCompletenessStatsColumns(params, completenessStats);
    const { data: forms, isFetching: fetchingForms } = useGetFormsOptions([
        'period_type',
        'legend_threshold',
    ]);

    const mapResults =
        completenessMapStats?.filter(location => !location.is_root) || [];
    const displayWarning =
        mapResults?.length < (completenessStats?.count || 0) &&
        tab === 'map' &&
        !isFetchingMapStats;

    useEffect(() => {
        if (displayWarning) {
            dispatch(enqueueSnackbar(warningSnackBar(snackbarKey)));
        }
        // TODO restore this feature. Commented code causes an infinite loop
        // else {
        //     dispatch(closeFixedSnackbar(snackbarKey));
        // }
        return () => {
            if (displayWarning) {
                dispatch(closeFixedSnackbar(snackbarKey));
            }
        };
    }, [dispatch, displayWarning]);
    const csvUrl = useMemo(
        () =>
            `/api/v2/completeness_stats.csv?${buildQueryString(params, true)}`,
        [params],
    );
    const theme = useTheme();
    // Used to show the requested orgunit prominently.

    const selectedFormsIds: number[] = useMemo(
        () =>
            params.formId
                ? params.formId.split(',').map(id => parseInt(id, 10))
                : [],
        [params.formId],
    );
    const handleChangeTab = useCallback(
        (newTab: 'list' | 'map') => {
            setTab(newTab);
            const newParams = {
                ...params,
                tab: newTab,
            };
            redirectTo(baseUrl, newParams);
        },
        [params, redirectTo],
    );
    const getRowStyles = useCallback(
        ({ original }) => {
            if (original?.is_root) {
                return {
                    style: {
                        backgroundColor: Color(
                            theme.palette.primary.main,
                        ).lighten(2),
                    },
                };
            }
            return {};
        },
        [theme],
    );

    useEffect(() => {
        if (params.tab && params.tab !== tab) {
            handleChangeTab(params.tab);
        }
    }, [handleChangeTab, params.tab, tab]);
    const selectedFormsId = selectedFormsIds[0];

    const selectedForm = useMemo(() => {
        return forms?.find(form => `${form.value}` === `${selectedFormsId}`);
    }, [forms, selectedFormsId]);
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.completenessStats)}
                displayBackButton={false}
            />
            <Box p={4} className={classes.container}>
                <Box>
                    <CompletenessStatsFilters
                        params={params}
                        forms={forms}
                        fetchingForms={fetchingForms}
                    />
                </Box>
                <Grid
                    container
                    item
                    style={{ paddingTop: '5px', paddingBottom: '5px' }}
                >
                    <Grid item container justifyContent="flex-end">
                        <CsvButton csvUrl={csvUrl} />
                    </Grid>
                </Grid>
                <Box mt={2}>
                    <Tabs
                        value={tab}
                        onChange={(_, newtab) => handleChangeTab(newtab)}
                    >
                        <Tab
                            value="list"
                            label={formatMessage(MESSAGES.list)}
                        />
                        <Tab value="map" label={formatMessage(MESSAGES.map)} />
                    </Tabs>
                </Box>

                <Box
                    width="100%"
                    className={tab === 'map' ? '' : classes.hiddenOpacity}
                >
                    {selectedFormsIds.length !== 1 && (
                        <Paper
                            sx={{
                                mt: 2,
                                p: 2,
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            {formatMessage(MESSAGES.selectAForm)}
                        </Paper>
                    )}
                    {selectedFormsIds.length === 1 && (
                        <Map
                            locations={completenessMapStats || []}
                            isLoading={isFetchingMapStats}
                            params={params}
                            selectedFormId={selectedFormsId}
                            threshold={selectedForm?.original.legend_threshold}
                        />
                    )}
                </Box>
                {tab === 'list' && (
                    <Box mt={selectedFormsIds.length === 1 ? 0 : 2}>
                        <TableWithDeepLink
                            marginTop={false}
                            data={completenessStats?.results ?? []}
                            pages={completenessStats?.pages ?? 1}
                            defaultSorted={['name']}
                            columns={columns}
                            // @ts-ignore
                            count={completenessStats?.count ?? 0}
                            baseUrl={baseUrl}
                            countOnTop={false}
                            params={params}
                            extraProps={{ loading: isFetching }}
                            // @ts-ignore
                            rowProps={getRowStyles}
                        />
                    </Box>
                )}
            </Box>
        </>
    );
};
