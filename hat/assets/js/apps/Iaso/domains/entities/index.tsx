import React, { FunctionComponent, useState, useMemo } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    LoadingSpinner,
    useSafeIntl,
    useRedirectTo,
} from 'bluesquare-components';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { CountLabel } from './components/CountLabel';
import { CursorPagination } from './components/CursorPagination';
import { Filters } from './components/Filters';
import { ListMap } from './components/ListMap';
import { useColumns, baseUrl, defaultSorted } from './config';
import {
    useGetEntitiesLocations,
    useGetEntitiesPaginated,
    useGetEntitiesCount,
    useGetEntityTypesDropdown,
} from './hooks/requests';
import MESSAGES from './messages';
import type { Params } from './types/filters';
import { DisplayedLocation } from './types/locations';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    hiddenOpacity: {
        position: 'absolute',
        top: 0,
        left: -5000,
        zIndex: -10,
        opacity: 0,
    },
}));

export const Entities: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.entities) as unknown as Params;
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
        next,
        previous,
        columns: extraColumns,
    } = useMemo(() => {
        if (!data) {
            return {
                result: [],
                next: null,
                previous: null,
                columns: [],
            };
        }
        return data;
    }, [data]);

    const hasCursor = !!(next || previous);
    const { data: countData, isFetching: isFetchingCount } =
        useGetEntitiesCount(params, hasCursor);

    const lengthResults = data?.result?.length ?? 0;
    const totalCount = countData?.count ?? lengthResults;

    const handleNextPage = () => {
        if (next) {
            redirectTo(baseUrl, { ...params, cursor: next });
        }
    };

    const handlePrevPage = () => {
        if (previous) {
            redirectTo(baseUrl, { ...params, cursor: previous });
        }
    };
    const handlePageSizeChange = (newPageSize: number) => {
        redirectTo(baseUrl, {
            ...params,
            pageSize: newPageSize.toString(),
            cursor: 'null',
        });
    };

    const { cursor: _cursor, ...tableParams } = params;

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
            <MainWrapper sx={{ padding: 4 }} navHasTabs={true}>
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
                            <CountLabel
                                count={totalCount}
                                isFetching={isFetchingCount}
                            />
                            <TableWithDeepLink
                                marginTop={false}
                                data={result ?? []}
                                pages={1}
                                defaultSorted={defaultSorted}
                                columns={columns}
                                count={0}
                                countOnTop={false}
                                baseUrl={baseUrl}
                                params={tableParams}
                                showPagination={false}
                                extraProps={{ loading: isFetching }}
                                noDataMessage={
                                    !isSearchActive
                                        ? MESSAGES.searchToSeeEntities
                                        : undefined
                                }
                            />
                            {result?.length > 0 && (
                                <CursorPagination
                                    hasNext={!!next}
                                    hasPrev={!!previous}
                                    onNext={handleNextPage}
                                    onPrev={handlePrevPage}
                                    pageSize={Number(params.pageSize) || 20}
                                    onPageSizeChange={handlePageSizeChange}
                                />
                            )}
                        </Box>
                    )}
                </Box>
            </MainWrapper>
        </>
    );
};
