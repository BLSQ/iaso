import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { push } from 'react-router-redux';
import { bindActionCreators } from 'redux';

import { withStyles, Button } from '@material-ui/core';
import Autorenew from '@material-ui/icons/Autorenew';

import PropTypes from 'prop-types';

import {
    createUrl,
    injectIntl,
    commonStyles,
    TopBar,
} from 'bluesquare-components';
import {
    fetchAlgorithms,
    fetchAlgorithmRuns,
    deleteAlgorithmRun,
    runAlgorithm,
    fetchSources,
} from '../../utils/requests';

import { setAlgorithms } from './actions';

import { setSources } from '../orgUnits/actions';

import { runsTableColumns } from './config';

import SingleTable from '../../components/tables/SingleTable';
import AddRunDialogComponent from './components/AddRunDialogComponent';
import { fetchUsersProfiles as fetchUsersProfilesAction } from '../users/actions';

import { runsFilters } from '../../constants/filters';

import { baseUrls } from '../../constants/urls';

import MESSAGES from './messages';

const baseUrl = baseUrls.algos;

const styles = theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginTop: theme.spacing(4),
    },
});

class Runs extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: runsTableColumns(props.intl.formatMessage, this),
            forceRefresh: false,
            refreshEnable: false,
        };
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        const { dispatch, fetchUsersProfiles } = this.props;
        fetchUsersProfiles();
        fetchSources(dispatch).then(sources => this.props.setSources(sources));
        fetchAlgorithms(dispatch).then(algoList =>
            this.props.setAlgorithms(algoList),
        );
    }

    onSelectRunLinks(runItem) {
        const params = {
            algorithmRunId: runItem.id,
            searchActive: true,
        };
        this.props.redirectTo(baseUrls.links, params);
    }

    onRefresh() {
        this.setState({
            forceRefresh: true,
        });
    }

    deleteRuns(run) {
        const { dispatch } = this.props;
        return deleteAlgorithmRun(dispatch, run.id).then(() => {
            this.onRefresh();
        });
    }

    executeRun(run) {
        const { dispatch } = this.props;
        runAlgorithm(dispatch, run).then(() => {
            this.onRefresh();
        });
        setTimeout(() => this.onRefresh(), 500);
    }

    render() {
        const {
            classes,
            params,
            intl: { formatMessage },
            algorithms,
            profiles,
            sources,
        } = this.props;
        const { tableColumns, forceRefresh, refreshEnable } = this.state;
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
            <>
                <TopBar title={formatMessage(MESSAGES.runsTitle)} />
                <SingleTable
                    baseUrl={baseUrl}
                    endPointPath="algorithmsruns"
                    exportButtons={false}
                    dataKey="runs"
                    forceRefresh={forceRefresh}
                    onForceRefreshDone={() => {
                        this.setState({
                            forceRefresh: false,
                        });
                    }}
                    apiParams={{
                        ...params,
                    }}
                    searchActive={params.searchActive === 'true'}
                    fetchItems={fetchAlgorithmRuns}
                    defaultSorted={[{ id: 'ended_at', desc: true }]}
                    toggleActiveSearch
                    columns={tableColumns}
                    filters={runsFilters(
                        formatMessage,
                        algorithms,
                        profiles,
                        sources,
                        currentOrigin,
                        currentDestination,
                    )}
                    onDataLoaded={() => {
                        this.setState({
                            refreshEnable: true,
                        });
                    }}
                    searchExtraComponent={
                        <Button
                            disabled={!refreshEnable}
                            variant="contained"
                            color="primary"
                            onClick={() => this.onRefresh()}
                            className={classes.marginRight}
                        >
                            <Autorenew className={classes.buttonIcon} />
                            <FormattedMessage {...MESSAGES.refresh} />
                        </Button>
                    }
                    extraComponent={
                        <AddRunDialogComponent
                            executeRun={runItem => this.executeRun(runItem)}
                        />
                    }
                />
            </>
        );
    }
}
Runs.defaultProps = {
    reduxPage: undefined,
    sources: [],
};

Runs.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    reduxPage: PropTypes.object,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    setAlgorithms: PropTypes.func.isRequired,
    setSources: PropTypes.func.isRequired,
    fetchUsersProfiles: PropTypes.func.isRequired,
    sources: PropTypes.array,
    profiles: PropTypes.array.isRequired,
    algorithms: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    reduxPage: state.links.runsPage,
    sources: state.orgUnits.sources,
    algorithms: state.links.algorithmsList,
    profiles: state.users.list,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) =>
        dispatch(push(`${key}${createUrl(params, '')}`)),
    setAlgorithms: algoList => dispatch(setAlgorithms(algoList)),
    setSources: sources => dispatch(setSources(sources)),
    ...bindActionCreators(
        {
            fetchUsersProfiles: fetchUsersProfilesAction,
        },
        dispatch,
    ),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(Runs)),
);
