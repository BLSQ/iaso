import React, { FunctionComponent, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Box, Tabs, Tab } from '@mui/material';
import { makeStyles } from '@mui/styles';

import {
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    LoadingSpinner,
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
import TopBar from '../../components/nav/TopBarComponent';
import { Filters } from './components/Filters';
import {
    useGetBeneficiariesPaginated,
    useGetBeneficiaryTypesDropdown,
} from './hooks/requests';

import { useColumns, baseUrl, defaultSorted } from './config';
import MESSAGES from './messages';

import { redirectTo } from '../../routing/actions';
import { ListMap } from './components/ListMap';

import { MENU_HEIGHT_WITH_TABS } from '../../constants/uiConstants';

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
};

type Props = {
    params: Params;
};

export const Beneficiaries: FunctionComponent<Props> = ({ params }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();

    const { data, isFetching } = useGetBeneficiariesPaginated(params);
    const [tab, setTab] = useState(params.tab ?? 'list');

    const isLoading = isFetching;
    const handleChangeTab = (newTab: string) => {
        setTab(newTab);
        const newParams = {
            ...params,
            tab: newTab,
        };
        dispatch(redirectTo(baseUrl, newParams));
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

    const { data: types } = useGetBeneficiaryTypesDropdown();

    let entityTypeName;
    if (entityTypeIds.length === 1) {
        const currentType = types?.find(
            type => `${type.value}` === entityTypeIds[0],
        );
        if (currentType) {
            entityTypeName = currentType.label;
        }
    }
    return (
        <>
            {isLoading && tab === 'map' && <LoadingSpinner />}
            <TopBar
                title={`${formatMessage(MESSAGES.beneficiaries)}${
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
                <Filters params={params} isFetching={isFetching} />
                <Box position="relative" width="100%" mt={2}>
                    <Box
                        width="100%"
                        className={tab === 'map' ? '' : classes.hiddenOpacity}
                    >
                        {!isFetching && (
                            <ListMap
                                locations={
                                    data?.result?.map(beneficiary => ({
                                        latitude:
                                            beneficiary.org_unit?.latitude,
                                        longitude:
                                            beneficiary.org_unit?.longitude,
                                        orgUnit: beneficiary.org_unit,
                                        id: beneficiary.id,
                                        original: {
                                            ...beneficiary,
                                        },
                                    })) || []
                                }
                                isFetchingLocations={isFetching}
                                extraColumns={extraColumns}
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
                                onTableParamsChange={p =>
                                    dispatch(redirectTo(baseUrl, p))
                                }
                            />
                        </Box>
                    )}
                </Box>
            </Box>
        </>
    );
};
