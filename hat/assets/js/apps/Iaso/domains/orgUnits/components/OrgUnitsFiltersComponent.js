import React, { useState, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { CirclePicker } from 'react-color';

import { FormLabel, Button, Box, makeStyles } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';

import Add from '@material-ui/icons/Add';
import Search from '@material-ui/icons/Search';
import classNames from 'classnames';
import { commonStyles, useSafeIntl } from 'bluesquare-components';

import FiltersComponent from '../../../components/filters/FiltersComponent';
import { redirectTo } from '../../../routing/actions';
import { getChipColors, chipColors } from '../../../constants/chipColors';

import {
    search,
    status,
    hasInstances,
    orgUnitType,
    source,
    shape,
    location,
    group,
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
import { iasoGetRequest, useAPI } from '../../../utils/requests';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    root: {
        paddingBottom: theme.spacing(4),
    },
    colorContainer: {
        marginBottom: theme.spacing(2),
        marginTop: theme.spacing(2),
    },
    marginBottom: {
        marginBottom: theme.spacing(2),
        display: 'block',
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

const useInitialOrgUnit = orgUnitId => {
    const request = useCallback(async () => {
        let data = null;
        if (orgUnitId) {
            data = await iasoGetRequest({
                disableSuccessSnackBar: true,
                requestParams: {
                    url: `/api/orgunits/${orgUnitId}`,
                },
            });
        }
        return data;
    }, [orgUnitId]);
    const result = useAPI(request, null);
    return result;
};

const OrgUnitsFiltersComponent = ({
    params,
    baseUrl,
    searchIndex,
    onSearch,
}) => {
    const initalSearches = [...decodeSearch(params.searches)];
    const searchParams = initalSearches[searchIndex];
    const [initialOrgUnitId, setInitialOrgUnitId] = useState(
        searchParams?.levels,
    );
    const { data: initialOrgUnit } = useInitialOrgUnit(initialOrgUnitId);
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
        : getChipColors(0);

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
                        ]}
                        onEnterPressed={() => handleSearch()}
                    />
                    <div className={classes.colorContainer}>
                        <FormLabel className={classes.marginBottom}>
                            <FormattedMessage {...MESSAGES.color} />:
                        </FormLabel>
                        <CirclePicker
                            width="100%"
                            colors={chipColors}
                            color={currentColor}
                            onChangeComplete={color =>
                                onChange(color.hex.replace('#', ''), 'color')
                            }
                        />
                    </div>
                </Grid>
                <Grid item xs={8}>
                    <Grid container item xs={12}>
                        <DatesRange
                            onChangeDate={(key, value) => {
                                onChange(value, key);
                            }}
                            dateFrom={searchParams.dateFrom}
                            dateTo={searchParams.dateTo}
                        />
                    </Grid>

                    <Grid container spacing={4}>
                        <Grid item xs={6}>
                            <FiltersComponent
                                params={params}
                                baseUrl={baseUrl}
                                filters={[
                                    extendFilter(
                                        searchParams,
                                        location(intl.formatMessage),
                                        (value, urlKey) =>
                                            onChange(value, urlKey),
                                        searchIndex,
                                    ),
                                    extendFilter(
                                        searchParams,
                                        shape(intl.formatMessage),
                                        (value, urlKey) =>
                                            onChange(value, urlKey),
                                        searchIndex,
                                    ),
                                    extendFilter(
                                        searchParams,
                                        hasInstances(intl.formatMessage),
                                        (value, urlKey) =>
                                            onChange(value, urlKey),
                                        searchIndex,
                                    ),
                                ]}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Box>
                                <FiltersComponent
                                    params={params}
                                    baseUrl={baseUrl}
                                    filters={[
                                        extendFilter(
                                            searchParams,
                                            status(intl.formatMessage),
                                            (value, urlKey) =>
                                                onChange(value, urlKey),
                                            searchIndex,
                                        ),
                                        sourceFilter,
                                    ]}
                                />
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
                        </Grid>
                    </Grid>
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
};

export default OrgUnitsFiltersComponent;
