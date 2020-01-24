import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';


import { withStyles } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Search from '@material-ui/icons/Search';

import commonStyles from '../../styles/common';

import {
    search,
    status,
    hasInstances,
    orgUnitType,
    source,
    shape,
    location,
    locationsLimit,
    group,
} from '../../constants/filters';
import {
    setFiltersUpdated,
} from '../../redux/orgUnitsReducer';

import FiltersComponent from './FiltersComponent';
import OrgUnitsLevelsFiltersComponent from './OrgUnitsLevelsFiltersComponent';

import { createUrl } from '../../../../utils/fetchData';

const styles = theme => ({
    ...commonStyles(theme),
    root: {
        paddingBottom: theme.spacing(4),
    },
});

const extendFilter = (searchParams, filter, onChange) => ({
    ...filter,
    value: searchParams[filter.urlKey],
    callback: (value, urlKey) => onChange(value, urlKey),
});

class OrgUnitsFiltersComponent extends Component {
    onSearch() {
        if (this.props.filtersUpdated) {
            this.props.setFiltersUpdated(false);
            const tempParams = {
                ...this.props.params,
            };
            this.props.redirectTo(this.props.baseUrl, tempParams);
        }
        this.props.onSearch();
    }

    onChange(value, urlKey) {
        const {
            searchIndex,
            params,
        } = this.props;
        this.props.setFiltersUpdated(true);
        const searches = [...JSON.parse(params.searches)];
        searches[searchIndex] = {
            ...searches[searchIndex],
            [urlKey]: value,
        };
        const tempParams = {
            ...params,
            searches: JSON.stringify(searches),
        };
        this.props.redirectTo(this.props.baseUrl, tempParams);
    }

    render() {
        const {
            params,
            classes,
            baseUrl,
            intl: {
                formatMessage,
            },
            orgUnitTypes,
            sources,
            currentTab,
            filtersUpdated,
            groups,
            searchIndex,
        } = this.props;
        const searches = [...JSON.parse(params.searches)];
        const searchParams = searches[searchIndex];
        const filters = [
            extendFilter(searchParams, search(), (value, urlKey) => this.onChange(value, urlKey)),
            extendFilter(searchParams, orgUnitType(orgUnitTypes), (value, urlKey) => this.onChange(value, urlKey)),
            extendFilter(searchParams, group(groups), (value, urlKey) => this.onChange(value, urlKey)),
        ];
        if (currentTab === 'map') {
            filters.push(extendFilter(searchParams, locationsLimit(), (value, urlKey) => this.onChange(value, urlKey)));
        }
        return (
            <div className={classes.root}>
                <Grid container spacing={4}>
                    <Grid item xs={4}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            filters={filters}
                            onEnterPressed={() => this.onSearch()}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            filters={[
                                extendFilter(searchParams, location(formatMessage), (value, urlKey) => this.onChange(value, urlKey)),
                                extendFilter(searchParams, shape(formatMessage), (value, urlKey) => this.onChange(value, urlKey)),
                                extendFilter(searchParams, hasInstances(formatMessage), (value, urlKey) => this.onChange(value, urlKey)),
                            ]}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            filters={[
                                extendFilter(searchParams, status(formatMessage), (value, urlKey) => this.onChange(value, urlKey)),
                                extendFilter(searchParams, source(sources || [], true, true), (value, urlKey) => this.onChange(value, urlKey)),
                            ]}
                        />
                        <OrgUnitsLevelsFiltersComponent
                            onLevelsChange={levels => this.onChange(levels, 'levels')}
                            params={params}
                            baseUrl={baseUrl}
                            searchIndex={searchIndex}
                        />
                    </Grid>
                </Grid>
                <Grid container spacing={4} justify="flex-end" alignItems="center">
                    <Grid item xs={2} container justify="flex-end" alignItems="center">
                        <Button
                            disabled={!filtersUpdated && Boolean(params.searchActive)}
                            variant="contained"
                            className={classes.button}
                            color="primary"
                            onClick={() => this.onSearch()}
                        >
                            <Search className={classes.buttonIcon} />
                            <FormattedMessage id="iaso.search" defaultMessage="Search" />
                        </Button>
                    </Grid>
                </Grid>
            </div>
        );
    }
}
OrgUnitsFiltersComponent.defaultProps = {
    baseUrl: '',
    sources: [],
    groups: [],
};

OrgUnitsFiltersComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string,
    onSearch: PropTypes.func.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    sources: PropTypes.array,
    redirectTo: PropTypes.func.isRequired,
    currentTab: PropTypes.string.isRequired,
    setFiltersUpdated: PropTypes.func.isRequired,
    filtersUpdated: PropTypes.bool.isRequired,
    groups: PropTypes.array,
    searchIndex: PropTypes.number.isRequired,
};

const MapStateToProps = state => ({
    filtersUpdated: state.orgUnits.filtersUpdated,
    groups: state.orgUnits.groups,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setFiltersUpdated: filtersUpdated => dispatch(setFiltersUpdated(filtersUpdated)),
});

export default connect(MapStateToProps, MapDispatchToProps)(withStyles(styles)(injectIntl(OrgUnitsFiltersComponent)));
