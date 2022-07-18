import React, { FunctionComponent, useMemo } from 'react';
import { makeStyles, Box } from '@material-ui/core';
// @ts-ignore
import { commonStyles, useSafeIntl, DynamicTabs } from 'bluesquare-components';
import { useDispatch } from 'react-redux';

// COMPONENTS
import TopBar from '../../components/nav/TopBarComponent';
import { TableWithDeepLink } from '../../components/tables/TableWithDeepLink';
// COMPONENTS

// TYPES
import { UrlParams } from '../../types/table';
// TYPES

// UTILS
import { decodeSearch, encodeUriParams, mapOrgUnitByLocation } from './utils';
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
}));

type OrgUnitParams = UrlParams & {
    locationLimit: string;
    tab?: string;
    searchTabIndex: string;
    searchActive: string;
    searches: string;
};

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
                FILTERS, LIST, MAP
            </Box>
        </>
    );
};
