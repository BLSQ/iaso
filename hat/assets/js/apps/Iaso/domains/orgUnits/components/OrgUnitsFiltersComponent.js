import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import {
    Button,
    Box,
    makeStyles,
    Divider,
    Typography,
} from '@material-ui/core';
import Grid from '@material-ui/core/Grid';

import Add from '@material-ui/icons/Add';
import Search from '@material-ui/icons/Search';
import classNames from 'classnames';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { decodeSearch } from '../utils';

import FiltersComponent from '../../../components/filters/FiltersComponent';
import { SearchFilter } from '../../../components/filters/Search.tsx';
import { ColorPicker } from '../../../components/forms/ColorPicker';
import { redirectTo } from '../../../routing/actions';
import { getChipColors } from '../../../constants/chipColors';
import { useOrgUnitsFiltersData, useGetGroups } from '../hooks';

import {
    status,
    hasInstances,
    orgUnitType,
    source,
    group,
    geography,
} from '../../../constants/filters';
import {
    setFiltersUpdated,
    setOrgUnitsLocations,
    setFetchingOrgUnitTypes,
} from '../actions';

import DatesRange from '../../../components/filters/DatesRange';

import { baseUrls } from '../../../constants/urls';

import MESSAGES from '../messages';
import { OrgUnitTreeviewModal } from './TreeView/OrgUnitTreeviewModal';
import { useGetOrgUnit } from './TreeView/requests';

import { LocationLimit } from '../../../utils/map/LocationLimit';
import { useCurrentUser } from '../../../utils/usersUtils';

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

const retrieveSourceFromVersionId = (versionId, sources) => {
    const idAsNumber = parseInt(versionId, 10);
    const result = sources.find(
        src =>
            src.versions.filter(srcVersion => srcVersion.id === idAsNumber)
                .length > 0,
    );
    return result?.id;
};

const OrgUnitsFiltersComponent = ({
    params,
    baseUrl,
    searchIndex,
    currentTab,
    onSearch,
}) => {
    const { formatMessage } = useSafeIntl();
    const decodedSearches = useMemo(
        () => [...decodeSearch(decodeURI(params.searches))],
        [params.searches],
    );
    const [searchParams, setSearchParams] = useState(
        decodedSearches[searchIndex] ?? {},
    );

    // get user in order to get dataSourceId
    const currentUser = useCurrentUser();
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
    const [dataSourceId, setDataSourceId] = useState();
    const [sourceVersionId, setSourceVersionId] = useState();
    const [hasLocationLimitError, setHasLocationLimitError] = useState(false);
    const [textSearchError, setTextSearchError] = useState(false);
    const [initialOrgUnitId, setInitialOrgUnitId] = useState(
        searchParams?.levels,
    );

    const { data: initialOrgUnit } = useGetOrgUnit(initialOrgUnitId);
    const intl = useSafeIntl();
    const classes = useStyles();
    const filtersUpdated = useSelector(state => state.orgUnits.filtersUpdated);
    const { groups, isFetchingGroups } = useGetGroups({
        dataSourceId,
        sourceVersionId,
    });
    const orgUnitsLocations = useSelector(
        state => state.orgUnits.orgUnitsLocations,
    );
    const isClusterActive = useSelector(state => state.map.isClusterActive);
    // not replacing with useQuery as it creates a double call, and the redux state value is used elsewhere
    const sources = useSelector(state => state.orgUnits.sources);

    const orgUnitTypes = useSelector(state => state.orgUnits.orgUnitTypes);
    const isFetchingOrgUnitTypes = useSelector(
        state => state.orgUnits.fetchingOrgUnitTypes,
    );
    const versionsDropDown = useMemo(() => {
        if (!sources || !dataSourceId) return [];
        return (
            sources
                .filter(src => src.id === dataSourceId)[0]
                ?.versions.sort((a, b) => a.number - b.number)
                .map(version => ({
                    label: version.number.toString(),
                    value: version.id.toString(),
                })) ?? []
        );
    }, [dataSourceId, sources]);
    const dispatch = useDispatch();

    useOrgUnitsFiltersData(dispatch, setFetchingOrgUnitTypes);

    const formatSearchParams = useCallback(
        updatedSearchParams => {
            const searches = [...decodedSearches];
            searches[searchIndex] = updatedSearchParams;
            return {
                ...params,
                page: 1,
                searches: JSON.stringify(searches),
            };
        },
        [decodedSearches, params, searchIndex],
    );

    const onChange = (value, urlKey) => {
        if (urlKey === 'version') {
            setSourceVersionId(value);
        }
        if (urlKey === 'source') {
            setInitialOrgUnitId(null);
            setDataSourceId(value);
            setSourceVersionId(null);
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

        const updatedSearch = {
            ...searchParams,
            [urlKey]: value,
        };

        if (urlKey === 'source') {
            delete updatedSearch.version;
        }

        if (urlKey === 'hasInstances' && value === 'false') {
            delete updatedSearch.dateFrom;
            delete updatedSearch.dateTo;
        }

        setSearchParams(updatedSearch);
        if (urlKey === 'color') {
            const searches = formatSearchParams(updatedSearch);
            dispatch(redirectTo(baseUrl, searches));
        }
    };

    const handleSearch = () => {
        const formattedParams = { ...searchParams };
        if (searchParams.source && searchParams.version) {
            delete formattedParams.source;
        }
        const searches = formatSearchParams(formattedParams);

        onSearch(searches);
    };

    const handleLocationLimitChange = locationLimit => {
        dispatch(setFiltersUpdated(true));
        const tempParams = {
            ...params,
            locationLimit,
        };

        const updatedSearch = {
            ...searchParams,
            locationLimit,
        };

        setSearchParams(updatedSearch);
        onSearch(tempParams);
    };
    const currentColor = searchParams.color
        ? `#${searchParams.color}`
        : getChipColors(searchIndex);

    const sourceFilter = {
        ...source(sources ?? [], false),
        loading: !sources,
        uid: `source-${searchIndex}`,
        value: dataSourceId,
        callback: (value, urlKey) => onChange(value, urlKey),
    };

    // Splitting this effect from the one below, so we can use the deps array
    useEffect(() => {
        // we may have a sourceVersionId but no dataSourceId if using deep linking
        // in that case we retrieve the dataSourceId so we can display it
        if (!dataSourceId && !sourceVersionId && searchParams?.version) {
            const id = retrieveSourceFromVersionId(
                searchParams.version,
                sources,
            );
            setDataSourceId(id);
            setSourceVersionId(parseInt(searchParams.version, 10));
        }
    }, [dataSourceId, searchParams.version, sourceVersionId, sources]);

    useEffect(() => {
        // if no dataSourceId or sourceVersionId are provided, use the default from user
        if (
            !dataSourceId &&
            !sourceVersionId &&
            !searchParams?.version &&
            currentUser?.account?.default_version?.data_source?.id
        ) {
            setDataSourceId(
                searchParams?.source ??
                    currentUser?.account?.default_version?.data_source?.id,
            );
            setSourceVersionId(
                searchParams?.version ??
                    currentUser?.account?.default_version?.id,
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Set the version to the sources default version when changing source
    useEffect(() => {
        if (dataSourceId) {
            const dataSource = sources?.find(src => src.id === dataSourceId);
            if (
                dataSource &&
                !dataSource.versions.find(
                    version => version.id === parseInt(sourceVersionId, 10),
                )
            ) {
                const selectedVersion = dataSource?.default_version?.id;
                setSourceVersionId(selectedVersion);
            }
        }
    }, [dataSourceId, sourceVersionId, sources]);
    return (
        <div className={classes.root}>
            <Grid container spacing={4}>
                <Grid item xs={4}>
                    <Box mt={3} mb={4}>
                        <ColorPicker
                            currentColor={currentColor}
                            onChangeColor={color =>
                                onChange(color.replace('#', ''), 'color')
                            }
                        />
                    </Box>
                    <SearchFilter
                        withMarginTop
                        uid={`search-${searchIndex}`}
                        onEnterPressed={handleSearch}
                        onChange={(value, urlKey) => onChange(value, urlKey)}
                        keyValue="search"
                        required
                        value={searchParams.search || ''}
                        onErrorChange={setTextSearchError}
                    />
                    <FiltersComponent
                        params={params}
                        baseUrl={baseUrl}
                        filters={[sourceFilter]}
                    />
                    {!showAdvancedSettings && (
                        <Typography
                            className={classes.advancedSettings}
                            variant="overline"
                            onClick={() => setShowAdvancedSettings(true)}
                        >
                            {formatMessage(MESSAGES.showAdvancedSettings)}
                        </Typography>
                    )}
                    {showAdvancedSettings && (
                        <>
                            <FiltersComponent
                                params={params}
                                baseUrl={baseUrl}
                                filters={[
                                    {
                                        urlKey: 'version',
                                        isMultiSelect: false,
                                        isClearable: true,
                                        type: 'select',
                                        label: MESSAGES.sourceVersion,
                                        displayColor: false,
                                        value: sourceVersionId,
                                        uid: 'version-filter',
                                        loading: !source,
                                        callback: (value, urlKey) =>
                                            onChange(value, urlKey),
                                        options: versionsDropDown,
                                    },
                                ]}
                            />
                            <Typography
                                className={classes.advancedSettings}
                                variant="overline"
                                onClick={() => setShowAdvancedSettings(false)}
                            >
                                {formatMessage(MESSAGES.hideAdvancedSettings)}
                            </Typography>
                        </>
                    )}
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
                                        ...orgUnitType(orgUnitTypes ?? []),
                                        loading: isFetchingOrgUnitTypes,
                                        withMarginTop: false,
                                    },
                                    (value, urlKey) => onChange(value, urlKey),
                                    searchIndex,
                                ),
                                extendFilter(
                                    searchParams,
                                    {
                                        ...group(groups ?? []),
                                        loading: isFetchingGroups,
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
                                <LocationLimit
                                    keyValue="locationLimit"
                                    onChange={(urlKey, value) => {
                                        handleLocationLimitChange(value);
                                    }}
                                    value={params.locationLimit}
                                    setHasError={setHasLocationLimitError}
                                />
                            </Box>
                        </>
                    )}
                </Grid>
                <Grid item xs={4}>
                    <Box mb={1} mt={-1}>
                        <OrgUnitTreeviewModal
                            toggleOnLabelClick={false}
                            titleMessage={MESSAGES.parent}
                            onConfirm={orgUnit => {
                                // TODO rename levels in to parent
                                onChange(orgUnit?.id, 'levels');
                            }}
                            source={dataSourceId}
                            version={sourceVersionId}
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
                            (!filtersUpdated && Boolean(params.searchActive)) ||
                            hasLocationLimitError ||
                            textSearchError
                        }
                        data-test="search-button"
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
