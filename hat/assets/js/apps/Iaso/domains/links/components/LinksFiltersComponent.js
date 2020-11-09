import React, { Component, Fragment } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';

import { withStyles } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Search from '@material-ui/icons/Search';

import commonStyles from '../../../styles/common';

import {
    search,
    orgUnitType,
    source,
    status,
    validator,
    algo,
    score,
    version,
    algoRun,
} from '../../../constants/filters';

import FiltersComponent from '../../../components/filters/FiltersComponent';

import { createUrl } from '../../../utils/fetchData';

import MESSAGES from '../messages';

const styles = theme => ({
    ...commonStyles(theme),
});

class LinksFiltersComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            filtersUpdated: true,
        };
    }

    onFilterChanged() {
        this.setState({
            filtersUpdated: true,
        });
    }

    onSearch() {
        if (this.state.filtersUpdated) {
            this.setState({
                filtersUpdated: false,
            });
            const tempParams = {
                ...this.props.params,
            };
            tempParams.page = 1;
            this.props.redirectTo(this.props.baseUrl, tempParams);
        }
        this.props.onSearch();
    }

    render() {
        const {
            params,
            classes,
            baseUrl,
            intl: { formatMessage },
            orgUnitTypes,
            sources,
            profiles,
            algorithms,
            algorithmRuns,
        } = this.props;
        let currentOrigin;
        if (params.origin && sources) {
            currentOrigin = sources.find(
                s => s.id === parseInt(params.origin, 10),
            );
        }
        let currentDestination;
        if (params.destination && sources) {
            currentDestination = sources.find(
                s => s.id === parseInt(params.destination, 10),
            );
        }
        return (
            <Fragment>
                <Grid container spacing={4}>
                    <Grid item xs={3}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            onFilterChanged={() => this.onFilterChanged()}
                            filters={[
                                search(),
                                algoRun(algorithmRuns, formatMessage),
                                orgUnitType(orgUnitTypes),
                                status(formatMessage),
                            ]}
                            onEnterPressed={() => this.onSearch()}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            onFilterChanged={() => this.onFilterChanged()}
                            filters={[
                                validator(profiles),
                                algo(algorithms),
                                score(),
                            ]}
                            onEnterPressed={() => this.onSearch()}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            onFilterChanged={() => this.onFilterChanged()}
                            filters={[
                                source(
                                    sources || [],
                                    false,
                                    false,
                                    'origin',
                                    formatMessage(MESSAGES.sourceorigin),
                                ),
                                version(
                                    formatMessage,
                                    currentOrigin ? currentOrigin.versions : [],
                                    Boolean(
                                        !currentOrigin ||
                                            (currentOrigin &&
                                                currentOrigin.versions
                                                    .length === 0),
                                    ),
                                    false,
                                    'originVersion',
                                    formatMessage(MESSAGES.sourceoriginversion),
                                ),
                            ]}
                            onEnterPressed={() => this.onSearch()}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            onFilterChanged={() => this.onFilterChanged()}
                            filters={[
                                source(
                                    sources || [],
                                    false,
                                    false,
                                    'destination',
                                    formatMessage(MESSAGES.sourcedestination),
                                ),
                                version(
                                    formatMessage,
                                    currentDestination
                                        ? currentDestination.versions
                                        : [],
                                    Boolean(
                                        !currentDestination ||
                                            (currentDestination &&
                                                currentDestination.versions
                                                    .length === 0),
                                    ),
                                    false,
                                    'destinationVersion',
                                    formatMessage(
                                        MESSAGES.sourcedestinationversion,
                                    ),
                                ),
                            ]}
                            onEnterPressed={() => this.onSearch()}
                        />
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
                        xs={2}
                        container
                        justify="flex-end"
                        alignItems="center"
                    >
                        <Button
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
            </Fragment>
        );
    }
}
LinksFiltersComponent.defaultProps = {
    baseUrl: '',
    sources: [],
};

LinksFiltersComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string,
    onSearch: PropTypes.func.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    sources: PropTypes.array,
    profiles: PropTypes.array.isRequired,
    algorithms: PropTypes.array.isRequired,
    algorithmRuns: PropTypes.array.isRequired,
    redirectTo: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    orgUnitTypes: state.orgUnits.orgUnitTypes,
    sources: state.orgUnits.sources,
    profiles: state.users.list,
    algorithms: state.links.algorithmsList,
    algorithmRuns: state.links.algorithmRunsList,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) =>
        dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(
    MapStateToProps,
    MapDispatchToProps,
)(withStyles(styles)(injectIntl(LinksFiltersComponent)));
