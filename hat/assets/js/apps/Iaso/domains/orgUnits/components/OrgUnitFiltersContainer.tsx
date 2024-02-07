/* eslint-disable react/no-array-index-key */
import { Box, Button, AppBar } from '@mui/material';
import { makeStyles } from '@mui/styles';
import Add from '@mui/icons-material/Add';
import { useDispatch } from 'react-redux';
import {
    commonStyles,
    useSafeIntl,
    DynamicTabs,
    useSkipEffectOnMount,
    IntlFormatMessage,
} from 'bluesquare-components';
import React, {
    FunctionComponent,
    useState,
    useCallback,
    useMemo,
} from 'react';
import classnames from 'classnames';

import { isEqual } from 'lodash';
import { useCurrentUser } from '../../../utils/usersUtils';

import { SearchButton } from '../../../components/SearchButton';
import { OrgUnitFilters as Filters } from './OrgUnitsFilters';
import { redirectTo } from '../../../routing/actions';

import { OrgUnitParams } from '../types/orgUnit';

import { baseUrls } from '../../../constants/urls';
import { getChipColors } from '../../../constants/chipColors';

import { Search } from '../types/search';
import { Count } from '../hooks/requests/useGetOrgUnits';

import { decodeSearch } from '../utils';

import MESSAGES from '../messages';

type Props = {
    params: OrgUnitParams;
    paramsSearches: [Search];
    // eslint-disable-next-line no-unused-vars
    onSearch: (searches: any) => void;
    currentTab: string;
    counts: Count[];
    setDeletedTab: React.Dispatch<React.SetStateAction<boolean>>;
};

const baseUrl = baseUrls.orgUnits;
const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    hiddenOpacity: {
        position: 'absolute',
        top: '0px',
        left: '0px',
        zIndex: '-100',
        opacity: '0',
        width: '100%',
    },
    tabsContainer: {
        backgroundColor: `${theme.palette.primary.main} !important`,
        // to be over topbar shadow
        zIndex: '1101 fixed !important',
        position: 'fixed',
        top: '64px !important',
    },
    tabsContainerShadow: {
        position: 'absolute',
        bottom: 0,
        height: 10,
        width: '100%',
        zIndex: -1,
        boxShadow: '0 4px 5px -2px rgb(0 0 0 / 20%)',
    },
}));

export const OrgUnitFiltersContainer: FunctionComponent<Props> = ({
    params,
    onSearch,
    currentTab,
    paramsSearches,
    counts,
    setDeletedTab,
}) => {
    const dispatch = useDispatch();
    const currentUser = useCurrentUser();

    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const defaultSource = useMemo(
        () => currentUser?.account?.default_version?.data_source,
        [currentUser],
    );
    const [hasLocationLimitError, setHasLocationLimitError] =
        useState<boolean>(false);
    const [searches, setSearches] = useState<[Search]>(paramsSearches);
    const [locationLimit, setLocationLimit] = useState<number>(
        parseInt(params.locationLimit, 10),
    );
    const [textSearchError, setTextSearchError] = useState<boolean>(false);
    const currentSearchIndex = parseInt(params.searchTabIndex, 10);

    const handleSearch = useCallback(() => {
        const tempParams = {
            ...params,
            locationLimit,
            page: 1,
            searches,
        };
        onSearch(tempParams);
    }, [params, locationLimit, searches, onSearch]);

    const handleChangeColor = useCallback(
        (color: string, searchIndex: number) => {
            const newSearches = [...searches];
            newSearches[searchIndex].color = color.replace('#', '');
            const tempParams = {
                ...params,
                searches: JSON.stringify(newSearches),
            };
            dispatch(redirectTo(baseUrl, tempParams));
        },
        [searches, params, dispatch],
    );

    const handleDeleteDynamicTab = useCallback(
        newParams => {
            dispatch(redirectTo(baseUrl, newParams));
            setSearches(decodeSearch(decodeURI(newParams.searches)));
            setDeletedTab(true);
        },
        [dispatch, setDeletedTab],
    );
    const handleAddDynamicTab = useCallback(
        newParams => {
            dispatch(redirectTo(baseUrl, newParams));
            setSearches(decodeSearch(decodeURI(newParams.searches)));
        },
        [dispatch],
    );

    // update filter state if search changed in the url
    useSkipEffectOnMount(() => {
        if (!isEqual(decodeSearch(decodeURI(params.searches)), searches)) {
            setSearches(paramsSearches);
        }
    }, [params.searches]);

    return (
        <>
            <AppBar
                classes={{
                    root: classes.tabsContainer,
                }}
                elevation={0}
            >
                <DynamicTabs
                    deleteMessage={MESSAGES.delete}
                    addMessage={MESSAGES.add}
                    baseLabel={formatMessage(MESSAGES.search)}
                    params={{
                        ...params,
                        searches: JSON.stringify(searches),
                    }}
                    defaultItem={{
                        validation_status: 'all',
                        color: getChipColors(
                            searches.length + 1,
                            false,
                            searches.map(search => `#${search.color}`),
                        ).replace('#', ''),
                        source: defaultSource && defaultSource.id,
                    }}
                    paramKey="searches"
                    tabParamKey="searchTabIndex"
                    onTabChange={newParams => {
                        dispatch(redirectTo(baseUrl, newParams));
                    }}
                    onTabsDeleted={handleDeleteDynamicTab}
                    onTabsAdded={handleAddDynamicTab}
                    maxItems={9}
                    counts={counts}
                    displayCounts
                />
                <Box className={classes.tabsContainerShadow} />
            </AppBar>
            <Box px={4} mt={4}>
                {searches.map((search, searchIndex) => (
                    <Box
                        key={searchIndex}
                        className={
                            searchIndex === currentSearchIndex
                                ? ''
                                : classes.hiddenOpacity
                        }
                    >
                        <Filters
                            onSearch={handleSearch}
                            searchIndex={currentSearchIndex}
                            currentSearch={searches[searchIndex]}
                            searches={searches}
                            setTextSearchError={setTextSearchError}
                            setSearches={setSearches}
                            onChangeColor={handleChangeColor}
                            currentTab={currentTab}
                            setHasLocationLimitError={setHasLocationLimitError}
                            locationLimit={locationLimit}
                            setLocationLimit={setLocationLimit}
                        />
                    </Box>
                ))}
                <Box mt={2} justifyContent="flex-end" display="flex">
                    <Box display="inline-block" mr={2}>
                        <Button
                            variant="contained"
                            className={classnames(classes.button)}
                            color="primary"
                            onClick={() =>
                                dispatch(
                                    redirectTo(baseUrls.orgUnitDetails, {
                                        orgUnitId: '0',
                                    }),
                                )
                            }
                        >
                            <Add className={classes.buttonIcon} />
                            {formatMessage(MESSAGES.create)}
                        </Button>
                    </Box>
                    <SearchButton
                        disabled={textSearchError || hasLocationLimitError}
                        onSearch={handleSearch}
                    />
                </Box>
            </Box>
        </>
    );
};
