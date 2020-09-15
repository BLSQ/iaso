import React, { Component, Fragment } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';

import { withStyles } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Search from '@material-ui/icons/Search';
import Autorenew from '@material-ui/icons/Autorenew';

import commonStyles from '../../../styles/common';

import { algo, source, profile, version } from '../../../constants/filters';

import FiltersComponent from '../../../components/filters/FiltersComponent';

import { createUrl } from '../../../utils/fetchData';

import MESSAGES from '../messages';

const styles = theme => ({
    ...commonStyles(theme),
});

class RunsFiltersComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            filtersUpdated: props.params.searchActive !== 'true',
            refreshEnabled: props.params.searchActive === 'true',
        };
    }

    componentDidUpdate(prevProps) {
        const tempParams = {
            ...this.props.params,
        };
        if (prevProps.params.origin !== this.props.params.origin) {
            tempParams.originVersion = undefined;
            this.props.redirectTo(this.props.baseUrl, tempParams);
        }
        if (prevProps.params.destination !== this.props.params.destination) {
            tempParams.destinationVersion = undefined;
            this.props.redirectTo(this.props.baseUrl, tempParams);
        }
    }

    onFilterChanged() {
        this.setState({
            filtersUpdated: true,
            refreshEnabled: true,
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
            algorithms,
            onRefresh,
            sources,
            profiles,
        } = this.props;
        const { filtersUpdated, refreshEnabled } = this.state;
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
                    <Grid item xs={4}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            onFilterChanged={() => this.onFilterChanged()}
                            filters={[
                                algo(algorithms),
                                profile(
                                    profiles || [],
                                    false,
                                    'launcher',
                                    formatMessage(MESSAGES.launcher),
                                ),
                            ]}
                            onEnterPressed={() => this.onSearch()}
                        />
                    </Grid>
                    <Grid item xs={4}>
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
                    <Grid item xs={4}>
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
                        xs={12}
                        container
                        justify="flex-end"
                        alignItems="center"
                    >
                        <Button
                            disabled={!refreshEnabled}
                            variant="contained"
                            color="primary"
                            onClick={() => onRefresh()}
                        >
                            <Autorenew className={classes.buttonIcon} />
                            <FormattedMessage {...MESSAGES.refresh} />
                        </Button>
                        <Button
                            disabled={!filtersUpdated}
                            variant="contained"
                            className={classes.marginLeft}
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
RunsFiltersComponent.defaultProps = {
    baseUrl: '',
    sources: [],
};

RunsFiltersComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string,
    onSearch: PropTypes.func.isRequired,
    onRefresh: PropTypes.func.isRequired,
    algorithms: PropTypes.array.isRequired,
    redirectTo: PropTypes.func.isRequired,
    sources: PropTypes.array,
    profiles: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    orgUnitTypes: state.orgUnits.orgUnitTypes,
    algorithms: state.links.algorithmsList,
    sources: state.orgUnits.sources,
    profiles: state.users.list,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) =>
        dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(
    MapStateToProps,
    MapDispatchToProps,
)(withStyles(styles)(injectIntl(RunsFiltersComponent)));
