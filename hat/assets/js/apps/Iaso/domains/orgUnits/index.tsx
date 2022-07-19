import React, { FunctionComponent, useMemo, useState } from 'react';
import { makeStyles, Box, Tabs, Tab } from '@material-ui/core';
// @ts-ignore
import { commonStyles, useSafeIntl, DynamicTabs } from 'bluesquare-components';
import { useDispatch } from 'react-redux';

// COMPONENTS
import { OrgUnitFiltersContainer } from './components/OrgUnitFiltersContainer';
import TopBar from '../../components/nav/TopBarComponent';
// import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
// COMPONENTS

// TYPES
import { OrgUnitParams } from './types/orgUnit';
// TYPES

// UTILS
import {
    decodeSearch,
    // encodeUriParams,
    // mapOrgUnitByLocation,
} from './utils';
import { useCurrentUser } from '../../utils/usersUtils';
import { redirectTo } from '../../routing/actions';
// UTILS

// CONSTANTS
import { baseUrls } from '../../constants/urls';
import MESSAGES from './messages';
import { getChipColors } from '../../constants/chipColors';
// CONSTANTS

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

const baseUrl = baseUrls.orgUnitsNew;
export const OrgUnits: FunctionComponent<Props> = ({ params }) => {
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const searchCounts = [];

    const [tab, setTab] = useState<string>(params.tab ?? 'list');

    const searches = useMemo(
        () => decodeSearch(params.searches),
        [params.searches],
    );
    const defaultSource = useMemo(
        () => currentUser?.account?.default_version?.data_source,
        [currentUser],
    );

    const onTabsDeleted = newParams => {
        dispatch(redirectTo(baseUrl, newParams));
    };

    const onSearch = newParams => {
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

    return (
        <>
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
                    </>
                )}
            </Box>
        </>
    );
};
