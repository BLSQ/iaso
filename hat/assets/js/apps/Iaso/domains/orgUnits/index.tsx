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
import DownloadButtonsComponent from '../../components/DownloadButtonsComponent';
import TopBar from '../../components/nav/TopBarComponent';
import { getChipColors } from '../../constants/chipColors';
import { MENU_HEIGHT_WITHOUT_TABS } from '../../constants/uiConstants';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { OrgUnitFiltersContainer } from './components/OrgUnitFiltersContainer';
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

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    container: {
        width: '100%',
        height: `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px)`,
        padding: 0,
        margin: 0,
        overflow: 'auto',
        backgroundColor: 'white',
        position: 'relative',
        top: 48,
        '& .MuiSpeedDial-directionUp, &.MuiSpeedDial-directionLeft': {
            position: 'fixed',
        },
    },
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
    const isSearchActive: boolean = useMemo(
        () => params.searchActive === 'true',
        [params.searchActive],
    );
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
            isSearchActive,
            enabled: isSearchActive, // this is required to count result in search tab
        });
    const {
        data: orgUnitsDataLocation,
        isFetching: isFetchingOrgUnitsDataLocation,
    } = useGetOrgUnitsLocations({
        params: apiParamsLocations,
        searches,
        isSearchActive,
        enabled: tab === 'map' && isSearchActive,
    });
    // REQUESTS HOOKS

    const getSearchColor = useCallback(
        currentSearchIndex => {
            const currentSearch = searches[currentSearchIndex];
            let currentColor;
            if (currentSearch) {
                currentColor = currentSearch.color;
            }
            if (!currentColor) {
                currentColor = getChipColors(currentSearchIndex);
            } else {
                currentColor = `#${currentColor}`;
            }
            return currentColor;
        },
        [searches],
    );

    const onSearch = useCallback(
        newParams => {
            const tempParams = {
                ...newParams,
                searches: JSON.stringify(newParams.searches),
            };
            if (newParams.searchActive !== 'true') {
                tempParams.searchActive = true;
            }
            navigate(makeRedirectionUrl(baseUrl, tempParams), {
                replace: true,
            });
        },
        [navigate],
    );
    // TABS
    const handleChangeTab = useCallback(
        newtab => {
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

            <Box className={classes.container}>
                <OrgUnitFiltersContainer
                    params={params}
                    onSearch={onSearch}
                    currentTab={tab}
                    paramsSearches={searches || []}
                    counts={(!isLoading && orgUnitsData?.counts) || []}
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
                {isSearchActive && (
                    <Box px={4}>
                        <Tabs
                            value={tab}
                            classes={{
                                root: classes.tabs,
                            }}
                            className={classes.marginBottom}
                            indicatorColor="primary"
                            onChange={(event, newtab) =>
                                handleChangeTab(newtab)
                            }
                        >
                            <Tab
                                value="list"
                                label={formatMessage(MESSAGES.list)}
                            />
                            <Tab
                                value="map"
                                label={formatMessage(MESSAGES.map)}
                            />
                        </Tabs>
                        {tab === 'list' && (
                            <TableList
                                params={params}
                                saveMulti={saveMulti}
                                orgUnitsData={orgUnitsData}
                            />
                        )}

                        <Box
                            className={
                                tab === 'map' ? '' : classes.hiddenOpacity
                            }
                        >
                            <Box className={classes.containerMarginNeg}>
                                <OrgUnitsMap
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
                )}
            </Box>
        </>
    );
};
