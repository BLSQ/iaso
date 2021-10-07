import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { Button, Box, makeStyles, Divider } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';

import Add from '@material-ui/icons/Add';
import Search from '@material-ui/icons/Search';
import classNames from 'classnames';
import { commonStyles, useSafeIntl } from 'bluesquare-components';

import FiltersComponent from '../../../components/filters/FiltersComponent';
import { ColorPicker } from '../../../components/forms/ColorPicker';
import { redirectTo } from '../../../routing/actions';
import { getChipColors } from '../../../constants/chipColors';

import {
    search,
    status,
    hasInstances,
    orgUnitType,
    source,
    group,
    geography,
    locationsLimit,
} from '../../../constants/filters';
import {
    setFiltersUpdated,
    setOrgUnitsLocations,
    setFetchingOrgUnitTypes,
} from '../actions';

import DatesRange from '../../../components/filters/DatesRange';

import { decodeSearch, encodeUriSearches } from '../utils';
import { useOrgUnitsFiltersData } from '../hooks';
import { baseUrls } from '../../../constants/urls';

import MESSAGES from '../messages';
import { OrgUnitTreeviewModal } from './TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from './TreeView/requests';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    root: {
        paddingBottom: theme.spacing(4),
    },
    marginRight: {
        marginRight: theme.spacing(2),
    },
}));

const extendFilter = (searchParams, filter, onChange, searchIndex) => ({
    ...filter,
    uid: `${filter.urlKey}-${searchIndex}`,
    value: searchParams[filter.urlKey],
    callback: (value, urlKey) => onChange(value, urlKey),
});

const OrgUnitsFiltersComponent = ({
    params,
    baseUrl,
    searchIndex,
    onSearch,
    currentTab,
}) => {
    const initalSearches = [...decodeSearch(params.searches)];
    const searchParams = initalSearches[searchIndex];
    const [initialOrgUnitId, setInitialOrgUnitId] = useState(
        searchParams?.levels,
    );
    const { data: initialOrgUnit } = useGetOrgUnit(initialOrgUnitId);
    const intl = useSafeIntl();
    const classes = useStyles();
    const [fetchingGroups, setFetchingGroups] = useState(false);
    const filtersUpdated = useSelector(state => state.orgUnits.filtersUpdated);
    const groups = useSelector(state => state.orgUnits.groups) || [];
    const orgUnitsLocations = useSelector(
        state => state.orgUnits.orgUnitsLocations,
    );
    const isClusterActive = useSelector(state => state.map.isClusterActive);
    const orgUnitTypes = useSelector(state => state.orgUnits.orgUnitTypes);
    const sources = useSelector(state => state.orgUnits.sources);
    const fetchingOrgUnitTypes = useSelector(
        state => state.orgUnits.fetchingOrgUnitTypes,
    );
    const dispatch = useDispatch();

    useOrgUnitsFiltersData(
        dispatch,
        setFetchingOrgUnitTypes,
        setFetchingGroups,
    );

    const onChange = (value, urlKey) => {
        if (urlKey === 'source') {
            setInitialOrgUnitId(null);
        }
        if (urlKey === 'levels') {
            setInitialOrgUnitId(value);
        }
        if (urlKey !== 'color') {
            dispatch(setFiltersUpdated(true));
        } else if (isClusterActive) {
            // Ugly patch to force rerender of clusters
            const locations = [...orgUnitsLocations.locations];
            locations[searchIndex] = [];
            dispatch(
                setOrgUnitsLocations({
                    ...orgUnitsLocations,
                    locations,
                }),
            );
            setTimeout(() => {
                dispatch(setOrgUnitsLocations(orgUnitsLocations));
            }, 100);
        }
        const searches = [...decodeSearch(params.searches)];

        searches[searchIndex] = {
            ...searches[searchIndex],
            [urlKey]: value,
        };
        if (urlKey === 'hasInstances' && value === 'false') {
            delete searches[searchIndex].dateFrom;
            delete searches[searchIndex].dateTo;
        }

        const tempParams = {
            ...params,
            searches: encodeUriSearches(searches),
        };
        dispatch(redirectTo(baseUrl, tempParams));
    };

    const handleSearchFilterChange = (value, urlKey) => {
        // Remove the " character to avoid JSON parse to fail in front and back
        let newValue = value;
        if (value && value.length > 0) {
            if (value.slice(-1) === '"') {
                return null;
            }
            newValue = value.replace(new RegExp(/(")/, 'g'), '');
        }
        return onChange(newValue, urlKey);
    };

    const handleSearch = () => {
        const searches = [...decodeSearch(params.searches)];
        if (filtersUpdated) {
            dispatch(setFiltersUpdated(false));
            const tempParams = {
                ...params,
                searches: encodeUriSearches(searches),
            };
            dispatch(redirectTo(baseUrl, tempParams));
        }
        onSearch();
    };

    const currentColor = searchParams.color
        ? `#${searchParams.color}`
        : getChipColors(searchIndex);

    const sourceFilter = extendFilter(
        searchParams,
        {
            ...source(sources || [], false),
            loading: !sources,
        },
        (value, urlKey) => onChange(value, urlKey),
        searchIndex,
    );
    return (
        <div className={classes.root}>
            <Grid container spacing={4}>
                <Grid item xs={4}>
                    <ColorPicker
                        currentColor={currentColor}
                        onChangeColor={color => onChange(color, 'color')}
                    />
                    <FiltersComponent
                        params={params}
                        baseUrl={baseUrl}
                        filters={[
                            extendFilter(
                                searchParams,
                                search(),
                                (value, urlKey) =>
                                    handleSearchFilterChange(value, urlKey),
                                searchIndex,
                            ),
                            sourceFilter,
                        ]}
                        onEnterPressed={() => handleSearch()}
                    />
                </Grid>

                <Grid item xs={4}>
                    <Box mb={3}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            filters={[
                                extendFilter(
                                    searchParams,
                                    {
                                        ...orgUnitType(orgUnitTypes),
                                        loading: fetchingOrgUnitTypes,
                                    },
                                    (value, urlKey) => onChange(value, urlKey),
                                    searchIndex,
                                ),
                                extendFilter(
                                    searchParams,
                                    {
                                        ...group(groups),
                                        loading: fetchingGroups,
                                    },
                                    (value, urlKey) => onChange(value, urlKey),
                                    searchIndex,
                                ),
                                extendFilter(
                                    searchParams,
                                    status(intl.formatMessage),
                                    (value, urlKey) => onChange(value, urlKey),
                                    searchIndex,
                                ),
                            ]}
                        />
                    </Box>
                    {currentTab === 'map' && (
                        <>
                            <Divider />
                            <Box mt={2}>
                                <FiltersComponent
                                    params={params}
                                    baseUrl={baseUrl}
                                    onFilterChanged={() =>
                                        dispatch(setFiltersUpdated(true))
                                    }
                                    filters={[locationsLimit()]}
                                />
                            </Box>
                        </>
                    )}
                </Grid>
                <Grid item xs={4}>
                    <Box mb={2}>
                        <OrgUnitTreeviewModal
                            toggleOnLabelClick={false}
                            titleMessage={MESSAGES.parent}
                            onConfirm={orgUnit => {
                                // TODO rename levels in to parent
                                onChange(orgUnit?.id, 'levels');
                            }}
                            source={sourceFilter.value}
                            initialSelection={initialOrgUnit}
                        />
                    </Box>
                    <Box mb={3}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            filters={[
                                extendFilter(
                                    searchParams,
                                    geography(intl.formatMessage),
                                    (value, urlKey) => onChange(value, urlKey),
                                    searchIndex,
                                ),
                            ]}
                        />
                    </Box>
                    <Divider />
                    <Box mt={3}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            filters={[
                                extendFilter(
                                    searchParams,
                                    hasInstances(intl.formatMessage),
                                    (value, urlKey) => onChange(value, urlKey),
                                    searchIndex,
                                ),
                            ]}
                        />
                    </Box>
                    {(searchParams.hasInstances === 'true' ||
                        searchParams.hasInstances === 'duplicates') && (
                        <Box mt={-3}>
                            <DatesRange
                                onChangeDate={(key, value) => {
                                    onChange(value, key);
                                }}
                                dateFrom={searchParams.dateFrom}
                                dateTo={searchParams.dateTo}
                            />
                        </Box>
                    )}
                </Grid>
            </Grid>

            <Grid
                container
                spacing={4}
                justifyContent="flex-end"
                alignItems="center"
            >
                <Grid
                    item
                    xs={4}
                    container
                    justifyContent="flex-end"
                    alignItems="center"
                >
                    <Button
                        variant="contained"
                        className={classNames(
                            classes.button,
                            classes.marginRight,
                        )}
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
                        <FormattedMessage {...MESSAGES.create} />
                    </Button>
                    <Button
                        disabled={
                            !filtersUpdated && Boolean(params.searchActive)
                        }
                        variant="contained"
                        className={classes.button}
                        color="primary"
                        onClick={() => handleSearch()}
                    >
                        <Search className={classes.buttonIcon} />
                        <FormattedMessage {...MESSAGES.search} />
                    </Button>
                </Grid>
            </Grid>
        </div>
    );
};

OrgUnitsFiltersComponent.defaultProps = {
    baseUrl: '',
};

OrgUnitsFiltersComponent.propTypes = {
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string,
    onSearch: PropTypes.func.isRequired,
    searchIndex: PropTypes.number.isRequired,
    currentTab: PropTypes.string.isRequired,
};

export default OrgUnitsFiltersComponent;
