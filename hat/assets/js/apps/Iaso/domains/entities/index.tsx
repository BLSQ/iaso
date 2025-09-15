import React, { FunctionComponent, useState, useMemo } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    LoadingSpinner,
    useSafeIntl,
    useRedirectTo,
} from 'bluesquare-components';
import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { MENU_HEIGHT_WITH_TABS } from '../../constants/uiConstants';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { Filters } from './components/Filters';
import { ListMap } from './components/ListMap';
import { useColumns, baseUrl, defaultSorted } from './config';
import {
    useGetEntitiesLocations,
    useGetEntitiesPaginated,
    useGetEntityTypesDropdown,
} from './hooks/requests';
import MESSAGES from './messages';
import { DisplayedLocation } from './types/locations';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    container: {
        height: `calc(100vh - ${MENU_HEIGHT_WITH_TABS}px)`,
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

type Params = {
    pageSize: string;
    order: string;
    page: string;
    tab?: string;
    search?: string;
    entityTypes?: string;
    entityTypeIds?: string;
    locationLimit?: string;
    groups?: string;
    fieldsSearch?: string;
    isSearchActive?: string;
};

export const Entities: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.entities) as Params;
    const classes: Record<string, string> = useStyles();
    const [displayedLocation, setDisplayedLocation] =
        useState<DisplayedLocation>('submissions');
    const { formatMessage } = useSafeIntl();
    const redirectTo = useRedirectTo();
    const isSearchActive = params?.isSearchActive === 'true';

    const { data, isFetching } = useGetEntitiesPaginated(
        params,
        isSearchActive,
    );
    const [tab, setTab] = useState(params.tab ?? 'list');

    const isLoading = isFetching;
    const handleChangeTab = (newTab: string) => {
        setTab(newTab);
        const newParams = {
            ...params,
            tab: newTab,
        };
        redirectTo(baseUrl, newParams);
    };
    const entityTypeIds = useMemo(
        () => params.entityTypeIds?.split(',') || [],
        [params.entityTypeIds],
    );

    const {
        result,
        pages,
        count,
        columns: extraColumns,
    } = useMemo(() => {
        if (!data) {
            return {
                result: [],
                pages: 0,
                count: 0,
                columns: [],
            };
        }
        return data;
    }, [data]);
    const columns = useColumns(entityTypeIds, extraColumns || []);

    const { data: types } = useGetEntityTypesDropdown();

    let entityTypeName;
    if (entityTypeIds.length === 1) {
        const currentType = types?.find(
            type => `${type.value}` === entityTypeIds[0],
        );
        if (currentType) {
            entityTypeName = currentType.label;
        }
    }
    const { data: locations, isFetching: isFetchingLocations } =
        useGetEntitiesLocations(params, displayedLocation);

    return (
        <>
            {isLoading && tab === 'map' && <LoadingSpinner />}
            <TopBar
                title={`${formatMessage(MESSAGES.entities)}${
                    entityTypeName ? ` - ${entityTypeName}` : ''
                }`}
                displayBackButton={false}
            >
                <Tabs
                    textColor="inherit"
                    indicatorColor="secondary"
                    value={tab}
                    classes={{
                        root: classes.tabs,
                        indicator: classes.indicator,
                    }}
                    onChange={(_, newtab) => handleChangeTab(newtab)}
                >
                    <Tab value="list" label={formatMessage(MESSAGES.list)} />
                    <Tab value="map" label={formatMessage(MESSAGES.map)} />
                </Tabs>
            </TopBar>
            <Box p={4} className={classes.container}>
                <Filters
                    params={params}
                    isFetching={isFetching}
                    isSearchActive={isSearchActive}
                />
                <Box position="relative" width="100%" mt={2}>
                    <Box
                        width="100%"
                        className={tab === 'map' ? '' : classes.hiddenOpacity}
                    >
                        {!isFetching && (
                            <ListMap
                                locations={locations || []}
                                isFetchingLocations={isFetchingLocations}
                                extraColumns={extraColumns}
                                displayedLocation={displayedLocation}
                                setDisplayedLocation={setDisplayedLocation}
                            />
                        )}
                    </Box>
                    {tab === 'list' && (
                        <Box>
                            <TableWithDeepLink
                                marginTop={false}
                                data={result ?? []}
                                pages={pages ?? 1}
                                defaultSorted={defaultSorted}
                                columns={columns}
                                count={count ?? 0}
                                baseUrl={baseUrl}
                                params={params}
                                extraProps={{ loading: isFetching }}
                            />
                        </Box>
                    )}
                </Box>
            </Box>
        </>
    );
};
