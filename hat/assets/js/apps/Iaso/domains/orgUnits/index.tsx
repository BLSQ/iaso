import React, { FunctionComponent, useMemo, useState } from 'react';
import { makeStyles, Box, Tabs, Tab } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import {
    // @ts-ignore
    commonStyles,
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    DynamicTabs,
    // @ts-ignore
    selectionInitialState,
    // @ts-ignore
    setTableSelection,
    // @ts-ignore
    LoadingSpinner,
} from 'bluesquare-components';
import { useDispatch } from 'react-redux';

// COMPONENTS
import DownloadButtonsComponent from '../../components/DownloadButtonsComponent';
import { OrgUnitsMultiActionsDialog } from './components/OrgUnitsMultiActionsDialog';
import { OrgUnitFiltersContainer } from './components/OrgUnitFiltersContainer';
import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
// COMPONENTS

// TYPES
import { OrgUnit, OrgUnitParams } from './types/orgUnit';
import { Search } from './types/search';
import { Selection } from './types/selection';
// TYPES

// UTILS
import { decodeSearch } from './utils';
import { useCurrentUser } from '../../utils/usersUtils';
import { redirectTo } from '../../routing/actions';
// UTILS

// CONSTANTS
import { baseUrls } from '../../constants/urls';
import MESSAGES from './messages';
import { getChipColors } from '../../constants/chipColors';
// CONSTANTS

// HOOKS
import { useGetOrgUnits } from './hooks/requests/useGetOrgUnits';
import { useGetOrgUnitsTableColumns } from './hooks/useGetOrgUnitsTableColumns';
import { useBulkSaveOrgUnits } from './hooks/requests/useBulkSaveOrgUnits';
import { useGetApiParams } from './hooks/useGetApiParams';
// HOOKS

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
    },
}));

type Props = {
    params: OrgUnitParams;
};

// TODO:
// - replace orgUnits by orgUnitsNew
// - delete old index, filters
// - remove requests
// - emove messages

const baseUrl = baseUrls.orgUnitsNew;
export const OrgUnits: FunctionComponent<Props> = ({ params }) => {
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const searchCounts = [];

    const [multiActionPopupOpen, setMultiActionPopupOpen] =
        useState<boolean>(false);
    const [tab, setTab] = useState<string>(params.tab ?? 'list');
    const [selection, setSelection] = useState<Selection<OrgUnit>>(
        selectionInitialState,
    );

    const searches: [Search] = useMemo(
        () => decodeSearch(params.searches),
        [params.searches],
    );
    const columns = useGetOrgUnitsTableColumns(searches);
    const defaultSource = useMemo(
        () => currentUser?.account?.default_version?.data_source,
        [currentUser],
    );
    const { getUrl } = useGetApiParams(searches, params);

    const { mutateAsync: saveMulti, isLoading: isSavingMulti } =
        useBulkSaveOrgUnits();
    const { data: orgUnitsData, isFetching: isFetchingOrgUnits } =
        useGetOrgUnits(searches, params, params.searchActive);

    const onTabsDeleted = newParams => {
        handleTableSelection('reset');
        dispatch(redirectTo(baseUrl, newParams));
    };

    const onSearch = newParams => {
        handleTableSelection('reset');
        const tempParams = { ...newParams };
        if (newParams.searchActive !== 'true') {
            tempParams.searchActive = true;
        }
        dispatch(redirectTo(baseUrl, tempParams));
    };

    const handleChangeTab = newtab => {
        setTab(newtab);
        const newParams = {
            ...params,
            tab: newtab,
        };
        dispatch(redirectTo(baseUrl, newParams));
    };

    const handleTableSelection = (
        selectionType,
        items = [],
        totalCount = 0,
    ) => {
        const newSelection: Selection<OrgUnit> = setTableSelection(
            selection,
            selectionType,
            items,
            totalCount,
        );
        setSelection(newSelection);
    };

    const multiEditDisabled =
        !selection.selectAll && selection.selectedItems.length === 0;
    const selectionActions = useMemo(
        () => [
            {
                icon: <EditIcon />,
                label: formatMessage(MESSAGES.multiSelectionAction),
                onClick: () => setMultiActionPopupOpen(true),
                disabled: multiEditDisabled,
            },
        ],
        [multiEditDisabled, formatMessage],
    );
    return (
        <>
            <OrgUnitsMultiActionsDialog
                open={multiActionPopupOpen}
                params={params}
                closeDialog={() => setMultiActionPopupOpen(false)}
                selection={selection}
                saveMulti={saveMulti}
            />
            {isSavingMulti && <LoadingSpinner fixed={false} absolute />}
            <TopBar title={formatMessage(MESSAGES.title)}>
                <DynamicTabs
                    deleteMessage={MESSAGES.delete}
                    addMessage={MESSAGES.add}
                    baseLabel={formatMessage(MESSAGES.search)}
                    params={params}
                    defaultItem={{
                        validation_status: 'all',
                        color: getChipColors(searches.length + 1).replace(
                            '#',
                            '',
                        ),
                        source: defaultSource && defaultSource.id,
                    }}
                    paramKey="searches"
                    tabParamKey="searchTabIndex"
                    baseUrl={baseUrl}
                    redirectTo={(path, newParams) =>
                        dispatch(redirectTo(path, newParams))
                    }
                    onTabsUpdated={newParams =>
                        dispatch(redirectTo(baseUrl, newParams))
                    }
                    onTabChange={newParams =>
                        dispatch(redirectTo(baseUrl, newParams))
                    }
                    onTabsDeleted={onTabsDeleted}
                    maxItems={9}
                    counts={searchCounts}
                    displayCounts
                />
            </TopBar>
            <Box className={classes.containerFullHeightNoTabPadded}>
                <OrgUnitFiltersContainer
                    params={params}
                    onSearch={onSearch}
                    currentTab={tab}
                />
                {params.searchActive === 'true' && (
                    <>
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
                            <Box mt={-4}>
                                <TableWithDeepLink
                                    data={orgUnitsData?.orgunits || []}
                                    count={orgUnitsData?.count}
                                    pages={orgUnitsData?.pages}
                                    params={params}
                                    columns={columns}
                                    baseUrl={baseUrl}
                                    marginTop={false}
                                    extraProps={{
                                        loading:
                                            isFetchingOrgUnits || isSavingMulti,
                                        columns,
                                    }}
                                    multiSelect
                                    selection={selection}
                                    selectionActions={selectionActions}
                                    setTableSelection={(
                                        selectionType,
                                        items,
                                        totalCount,
                                    ) =>
                                        handleTableSelection(
                                            selectionType,
                                            items,
                                            totalCount,
                                        )
                                    }
                                />
                            </Box>
                        )}
                        {tab === 'list' &&
                            orgUnitsData &&
                            orgUnitsData?.orgunits?.length > 0 && (
                                <Box
                                    mb={4}
                                    mt={1}
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
                    </>
                )}
            </Box>
        </>
    );
};
