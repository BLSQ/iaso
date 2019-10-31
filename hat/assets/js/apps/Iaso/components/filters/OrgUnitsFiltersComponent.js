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

class OrgUnitsFiltersComponent extends Component {
    onFilterChanged() {
        this.props.setFiltersUpdated(true);
    }

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
        } = this.props;
        const filters = [
            search(),
            hasInstances(formatMessage),
        ];
        if (currentTab === 'map') {
            filters.push(locationsLimit());
        }
        return (
            <div className={classes.root}>
                <Grid container spacing={4}>
                    <Grid item xs={4}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            onFilterChanged={() => this.onFilterChanged()}
                            filters={filters}
                            onEnterPressed={() => this.onSearch()}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            onFilterChanged={() => this.onFilterChanged()}
                            filters={[
                                location(formatMessage),
                                shape(formatMessage),
                                orgUnitType(orgUnitTypes),
                            ]}
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            onFilterChanged={() => this.onFilterChanged()}
                            filters={[
                                source(sources || [], true, true),
                                status(formatMessage),
                            ]}
                        />
                        <OrgUnitsLevelsFiltersComponent
                            onLatestIdChanged={() => this.onFilterChanged()}
                            params={params}
                            baseUrl={baseUrl}
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
};

const MapStateToProps = state => ({
    filtersUpdated: state.orgUnits.filtersUpdated,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setFiltersUpdated: filtersUpdated => dispatch(setFiltersUpdated(filtersUpdated)),
});

export default connect(MapStateToProps, MapDispatchToProps)(withStyles(styles)(injectIntl(OrgUnitsFiltersComponent)));
