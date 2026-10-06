import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    LoadingSpinner,
    makeRedirectionUrl,
    useSafeIntl,
} from 'bluesquare-components';
import { useNavigate } from 'react-router-dom';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import { getColor, useGetColors } from 'Iaso/hooks/useGetColors';
import { SxStyles } from 'Iaso/types/general';
import DownloadButtonsComponent from '../../components/DownloadButtonsComponent';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { OrgUnitFiltersContainer } from './components/OrgUnitFiltersContainer';
import { OrgUnitsSearchMapLibre } from './components/orgUnitMapLibre/OrgUnitsSearchMapLibre';
import { OrgUnitsMap } from './components/OrgUnitsMap';
import { TableList } from './components/TableList';
import { useBulkSaveOrgUnits } from './hooks/requests/useBulkSaveOrgUnits';
import {
    useGetOrgUnits,
    useGetOrgUnitsLocations,
} from './hooks/requests/useGetOrgUnits';
import { useGetApiParams } from './hooks/useGetApiParams';
import MESSAGES from './messages';
import { OrgUnitParams } from './types/orgUnit';
import { Search } from './types/search';

import { decodeSearch } from './utils';

const styles: SxStyles = {
    mainWrapper: {
        top: 48,
        '& .MuiSpeedDial-directionUp, &.MuiSpeedDial-directionLeft': {
            position: 'fixed',
        },
    },
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    tabs: {
        ...commonStyles(theme).tabs,
        padding: 0,
    },
    hiddenOpacity: {
        position: 'absolute',
        top: '0px',
        left: '0px',
        zIndex: '-100',
        opacity: '0',
        width: '100%',
    },
}));

const baseUrl = baseUrls.orgUnits;
export const OrgUnits: FunctionComponent = () => {
    // HOOKS
    const params = useParamsObject(baseUrl) as unknown as OrgUnitParams;
    const navigate = useNavigate();
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    // HOOKS

    // STATE
    const [tab, setTab] = useState<string>(params.tab ?? 'list');
    // STATE

    // MEMO
    const searches: [Search] = useMemo(() => {
        return decodeSearch(decodeURI(params.searches));
    }, [params.searches]);
    // MEMO

    // CUSTOM HOOKS
    const { getUrl, apiParams } = useGetApiParams(searches, params);
    const { apiParams: apiParamsLocations } = useGetApiParams(
        searches,
        params,
        true,
    );
    // CUSTOM HOOKS

    // REQUESTS HOOKS
    const { mutateAsync: saveMulti, isLoading: isSavingMulti } =
        useBulkSaveOrgUnits();
    const { data: orgUnitsData, isFetching: isFetchingOrgUnits } =
        useGetOrgUnits({
            params: apiParams,
        });
    const {
        data: orgUnitsDataLocation,
        isFetching: isFetchingOrgUnitsDataLocation,
    } = useGetOrgUnitsLocations({
        params: apiParamsLocations,
        searches,
        enabled: tab === 'map',
    });
    // REQUESTS HOOKS
    const { data: colors } = useGetColors(true);
    const getSearchColor = useCallback(
        currentSearchIndex => {
            const currentSearch = searches[currentSearchIndex];
            let currentColor;
            if (currentSearch) {
                currentColor = currentSearch.color;
            }
            if (!currentColor) {
                currentColor = getColor(currentSearchIndex, colors);
            } else {
                currentColor = `#${currentColor}`;
            }
            return currentColor;
        },
        [searches, colors],
    );

    const onSearch = useCallback(
        (newParams: OrgUnitParams) => {
            // a new search, new results: the clustering picked for the last ones is dropped, so the maps go back
            // to their default (the MapLibre map: the server's pick for these results)
            const { isClusterActive: _isClusterActive, ...searchParams } =
                newParams;
            const tempParams = {
                ...searchParams,
                searches: JSON.stringify(newParams.searches),
            };
            navigate(makeRedirectionUrl(baseUrl, tempParams), {
                replace: true,
            });
        },
        [navigate],
    );
    const handleClustersChange = useCallback(
        (isClusterActive: boolean) => {
            navigate(
                makeRedirectionUrl(baseUrl, {
                    ...params,
                    isClusterActive: `${isClusterActive}`,
                }),
                { replace: true },
            );
        },
        [params, navigate],
    );
    // TABS
    const handleChangeTab = useCallback(
        (newtab: string) => {
            setTab(newtab);
            const newParams = {
                ...params,
                tab: newtab,
            };
            navigate(makeRedirectionUrl(baseUrl, newParams));
        },
        [params, navigate],
    );
    // TABS

    const isLoading =
        isFetchingOrgUnits ||
        isSavingMulti ||
        (tab === 'map' && isFetchingOrgUnitsDataLocation);
    return (
        <>
            {isLoading && <LoadingSpinner fixed={false} absolute />}
            <TopBar title={formatMessage(MESSAGES.title)} disableShadow />

            <MainWrapper sx={styles.mainWrapper}>
                <OrgUnitFiltersContainer
                    params={params}
                    onSearch={onSearch}
                    currentTab={tab}
                    paramsSearches={searches || []}
                    counts={(!isLoading && orgUnitsData?.counts) || []}
                    colors={colors || []}
                />
                {tab === 'list' &&
                    orgUnitsData &&
                    orgUnitsData?.orgunits?.length > 0 && (
                        <Box
                            mb={2}
                            mt={2}
                            mr={4}
                            display="flex"
                            justifyContent="flex-end"
                        >
                            <DownloadButtonsComponent
                                csvUrl={getUrl(true, 'csv')}
                                xlsxUrl={getUrl(true, 'xlsx')}
                                gpkgUrl={getUrl(true, 'gpkg')}
                            />
                        </Box>
                    )}

                <Box px={4}>
                    <Tabs
                        value={tab}
                        classes={{
                            root: classes.tabs,
                        }}
                        className={classes.marginBottom}
                        indicatorColor="primary"
                        onChange={(event, newtab) => handleChangeTab(newtab)}
                    >
                        <Tab
                            value="list"
                            label={formatMessage(MESSAGES.list)}
                        />
                        <Tab value="map" label={formatMessage(MESSAGES.map)} />
                        <Tab
                            value="mapLibre"
                            label={formatMessage(MESSAGES.mapLibre)}
                        />
                    </Tabs>
                    {/* MapLibre only draws while displayed: mounted with its tab */}
                    {tab === 'mapLibre' && (
                        <Box className={classes.containerMarginNeg}>
                            <OrgUnitsSearchMapLibre
                                searches={searches}
                                getSearchColor={getSearchColor}
                                // the user's pick, else the map lets the server decide
                                clusters={
                                    params.isClusterActive === undefined
                                        ? undefined
                                        : params.isClusterActive === 'true'
                                }
                                onClustersChange={handleClustersChange}
                            />
                        </Box>
                    )}
                    {tab === 'list' && (
                        <TableList
                            params={params}
                            saveMulti={saveMulti}
                            orgUnitsData={orgUnitsData}
                        />
                    )}

                    <Box className={tab === 'map' ? '' : classes.hiddenOpacity}>
                        <Box className={classes.containerMarginNeg}>
                            <OrgUnitsMap
                                params={params}
                                getSearchColor={getSearchColor}
                                orgUnits={
                                    orgUnitsDataLocation || {
                                        locations: [],
                                        shapes: [],
                                    }
                                }
                            />
                        </Box>
                    </Box>
                </Box>
            </MainWrapper>
        </>
    );
};
