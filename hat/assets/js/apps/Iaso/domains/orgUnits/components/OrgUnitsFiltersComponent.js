import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { CirclePicker } from 'react-color';

import { withStyles, FormLabel } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Add from '@material-ui/icons/Add';
import Search from '@material-ui/icons/Search';
import classNames from 'classnames';
import { createUrl, injectIntl } from 'bluesquare-components';
import commonStyles from '../../../styles/common';
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
import { setFiltersUpdated, setOrgUnitsLocations } from '../actions';

import FiltersComponent from '../../../components/filters/FiltersComponent';
import DatesRange from '../../../components/filters/DatesRange';
import OrgUnitsLevelsFiltersComponent from './OrgUnitsLevelsFiltersComponent';

import { decodeSearch, encodeUriSearches } from '../utils';
import { baseUrls } from '../../../constants/urls';
import MESSAGES from '../messages';

const styles = theme => ({
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
});

const extendFilter = (searchParams, filter, onChange, searchIndex) => ({
    ...filter,
    uid: `${filter.urlKey}-${searchIndex}`,
    value: searchParams[filter.urlKey],
    callback: (value, urlKey) => onChange(value, urlKey),
});

class OrgUnitsFiltersComponent extends Component {
    onSearch() {
        const { filtersUpdated, params, redirectTo, onSearch } = this.props;
        const searches = [...decodeSearch(params.searches)];
        if (filtersUpdated) {
            this.props.setFiltersUpdated(false);
            const tempParams = {
                ...params,
                searches: encodeUriSearches(searches),
            };
            redirectTo(this.props.baseUrl, tempParams);
        }
        onSearch();
    }

    onChange(value, urlKey) {
        const { searchIndex, params, orgUnitsLocations, isClusterActive } =
            this.props;
        if (urlKey !== 'color') {
            this.props.setFiltersUpdated(true);
        } else if (isClusterActive) {
            // Ugly patch to force rerender of clusters
            const locations = [...orgUnitsLocations.locations];
            locations[searchIndex] = [];
            this.props.setOrgUnitsLocations({
                ...orgUnitsLocations,
                locations,
            });
            setTimeout(() => {
                this.props.setOrgUnitsLocations(orgUnitsLocations);
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
        this.props.redirectTo(this.props.baseUrl, tempParams);
    }

    render() {
        const {
            params,
            classes,
            baseUrl,
            intl: { formatMessage },
            orgUnitTypes,
            sources,
            filtersUpdated,
            groups,
            searchIndex,
            redirectTo,
        } = this.props;
        const searches = [...decodeSearch(params.searches)];
        const searchParams = searches[searchIndex];
        const currentColor = searchParams.color
            ? `#${searchParams.color}`
            : getChipColors(0);

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
                                        this.onChange(value, urlKey),
                                    searchIndex,
                                ),
                                extendFilter(
                                    searchParams,
                                    orgUnitType(orgUnitTypes),
                                    (value, urlKey) =>
                                        this.onChange(value, urlKey),
                                    searchIndex,
                                ),
                                extendFilter(
                                    searchParams,
                                    group(groups),
                                    (value, urlKey) =>
                                        this.onChange(value, urlKey),
                                    searchIndex,
                                ),
                            ]}
                            onEnterPressed={() => this.onSearch()}
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
                                    this.onChange(
                                        color.hex.replace('#', ''),
                                        'color',
                                    )
                                }
                            />
                        </div>
                    </Grid>
                    <Grid item xs={8}>
                        <Grid container spacing={4}>
                            <Grid item xs={12}>
                                <DatesRange
                                    onChangeDate={(key, value) => {
                                        this.onChange(value, key);
                                    }}
                                    dateFrom={searchParams.dateFrom}
                                    dateTo={searchParams.dateTo}
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <FiltersComponent
                                    params={params}
                                    baseUrl={baseUrl}
                                    filters={[
                                        extendFilter(
                                            searchParams,
                                            location(formatMessage),
                                            (value, urlKey) =>
                                                this.onChange(value, urlKey),
                                            searchIndex,
                                        ),
                                        extendFilter(
                                            searchParams,
                                            shape(formatMessage),
                                            (value, urlKey) =>
                                                this.onChange(value, urlKey),
                                            searchIndex,
                                        ),
                                        extendFilter(
                                            searchParams,
                                            hasInstances(formatMessage),
                                            (value, urlKey) =>
                                                this.onChange(value, urlKey),
                                            searchIndex,
                                        ),
                                    ]}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <FiltersComponent
                                    params={params}
                                    baseUrl={baseUrl}
                                    filters={[
                                        extendFilter(
                                            searchParams,
                                            status(formatMessage),
                                            (value, urlKey) =>
                                                this.onChange(value, urlKey),
                                            searchIndex,
                                        ),
                                        extendFilter(
                                            searchParams,
                                            source(sources || [], false),
                                            (value, urlKey) =>
                                                this.onChange(value, urlKey),
                                            searchIndex,
                                        ),
                                    ]}
                                />
                                <OrgUnitsLevelsFiltersComponent
                                    onLevelsChange={levels =>
                                        this.onChange(levels, 'levels')
                                    }
                                    params={params}
                                    baseUrl={baseUrl}
                                    searchIndex={searchIndex}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>

                <Grid
                    container
                    spacing={4}
                    justify="flex-end"
                    alignItems="center"
                >
                    <Grid
                        item
                        xs={4}
                        container
                        justify="flex-end"
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
                                redirectTo(baseUrls.orgUnitDetails, {
                                    orgUnitId: '0',
                                })
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
                            onClick={() => this.onSearch()}
                        >
                            <Search className={classes.buttonIcon} />
                            <FormattedMessage {...MESSAGES.search} />
                        </Button>
                    </Grid>
                </Grid>
            </div>
        );
    }
}
OrgUnitsFiltersComponent.defaultProps = {
    baseUrl: '',
    groups: [],
    sources: undefined,
};

OrgUnitsFiltersComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string,
    onSearch: PropTypes.func.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    sources: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    redirectTo: PropTypes.func.isRequired,
    setFiltersUpdated: PropTypes.func.isRequired,
    filtersUpdated: PropTypes.bool.isRequired,
    groups: PropTypes.array,
    searchIndex: PropTypes.number.isRequired,
    orgUnitsLocations: PropTypes.object.isRequired,
    setOrgUnitsLocations: PropTypes.func.isRequired,
    isClusterActive: PropTypes.bool.isRequired,
};

const MapStateToProps = state => ({
    filtersUpdated: state.orgUnits.filtersUpdated,
    groups: state.orgUnits.groups,
    orgUnitsLocations: state.orgUnits.orgUnitsLocations,
    isClusterActive: state.map.isClusterActive,
    orgUnitTypes: state.orgUnits.orgUnitTypes,
    sources: state.orgUnits.sources,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) =>
        dispatch(push(`${key}${createUrl(params, '')}`)),
    setFiltersUpdated: filtersUpdated =>
        dispatch(setFiltersUpdated(filtersUpdated)),
    setOrgUnitsLocations: orgUnitsLocations =>
        dispatch(setOrgUnitsLocations(orgUnitsLocations)),
});

export default connect(
    MapStateToProps,
    MapDispatchToProps,
)(withStyles(styles)(injectIntl(OrgUnitsFiltersComponent)));
