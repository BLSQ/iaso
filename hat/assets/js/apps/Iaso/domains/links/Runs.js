import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { push } from 'react-router-redux';
import { bindActionCreators } from 'redux';

import { withStyles, Box, Grid } from '@material-ui/core';

import PropTypes from 'prop-types';

import {
    fetchAlgorithms,
    deleteAlgorithmRun,
    runAlgorithm,
    fetchSources,
} from '../../utils/requests';

import { setRuns, setIsFetching, setAlgorithms } from './actions';

import { setSources } from '../orgUnits/actions';

import { runsTableColumns } from './config';

import { createUrl } from '../../utils/fetchData';
import getTableUrl from '../../utils/tableUtils';

import TopBar from '../../components/nav/TopBarComponent';
import CustomTableComponent from '../../components/CustomTableComponent';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';
import RunsFiltersComponent from './components/RunsFiltersComponent';
import AddRunDialogComponent from './components/AddRunDialogComponent';
import { fetchUsersProfiles as fetchUsersProfilesAction } from '../users/actions';

import commonStyles from '../../styles/common';

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
            tableUrl: null,
            isUpdated: false,
        };
    }

    componentWillMount() {
        const { dispatch, fetchUsersProfiles } = this.props;
        fetchUsersProfiles();
        if (this.props.params.searchActive) {
            this.onSearch();
        }
        fetchSources(dispatch).then(sources => this.props.setSources(sources));
        fetchAlgorithms(dispatch).then(algoList =>
            this.props.setAlgorithms(algoList),
        );
    }

    componentDidUpdate() {
        if (!this.props.params.searchActive && this.props.reduxPage.list) {
            this.resetData();
        }
    }

    componentWillUnmount() {
        this.props.setRuns(null, this.props.params, 0, 1);
    }

    onSelectRunLinks(runItem) {
        const params = {
            algorithmRunId: runItem.id,
            searchActive: true,
        };
        this.props.redirectTo(baseUrls.links, params);
    }

    onSearch() {
        const { redirectTo, params } = this.props;
        const newParams = {
            ...params,
        };
        if (!params.searchActive) {
            newParams.searchActive = true;
        }
        redirectTo(baseUrl, newParams);
        const url = getTableUrl('algorithmsruns', this.props.params);
        this.setState({
            tableUrl: url,
        });
    }

    onRefresh() {
        this.setState({
            isUpdated: true,
        });
    }

    onDataStartLoaded() {
        const { dispatch } = this.props;
        this.setState({
            isUpdated: false,
        });
        dispatch(this.props.setIsFetching(true));
    }

    resetData() {
        this.setState({
            tableUrl: null,
        });
        this.props.setRuns(null, this.props.params, 0, 1);
    }

    deleteRuns(run) {
        const { dispatch } = this.props;
        dispatch(this.props.setIsFetching(true));
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
            reduxPage,
            intl: { formatMessage },
            dispatch,
            fetching,
        } = this.props;
        const { tableUrl, tableColumns, isUpdated } = this.state;

        return (
            <Fragment>
                {fetching && <LoadingSpinner />}
                <TopBar title={formatMessage(MESSAGES.runsTitle)} />
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <RunsFiltersComponent
                        baseUrl={baseUrl}
                        params={params}
                        onSearch={() => this.onSearch()}
                        onRefresh={() => this.onRefresh()}
                    />
                    {tableUrl && (
                        <div className={classes.reactTable}>
                            <CustomTableComponent
                                isSortable
                                pageSize={10}
                                showPagination
                                endPointUrl={tableUrl}
                                columns={tableColumns}
                                defaultSorted={[{ id: 'ended_at', desc: true }]}
                                params={params}
                                defaultPath={baseUrl}
                                dataKey="runs"
                                canSelect={false}
                                multiSort
                                onDataStartLoaded={() =>
                                    this.onDataStartLoaded()
                                }
                                onDataLoaded={(list, count, pages) => {
                                    dispatch(this.props.setIsFetching(false));
                                    this.props.setRuns(
                                        list,
                                        this.props.params,
                                        count,
                                        pages,
                                    );
                                }}
                                reduxPage={reduxPage}
                                isUpdated={isUpdated}
                            />
                        </div>
                    )}
                    <Grid
                        container
                        spacing={0}
                        justify="flex-end"
                        alignItems="center"
                        className={classes.marginTop}
                    >
                        <AddRunDialogComponent
                            executeRun={runItem => this.executeRun(runItem)}
                        />
                    </Grid>
                </Box>
            </Fragment>
        );
    }
}
Runs.defaultProps = {
    reduxPage: undefined,
};

Runs.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    reduxPage: PropTypes.object,
    params: PropTypes.object.isRequired,
    setRuns: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    setIsFetching: PropTypes.func.isRequired,
    fetching: PropTypes.bool.isRequired,
    setAlgorithms: PropTypes.func.isRequired,
    setSources: PropTypes.func.isRequired,
    fetchUsersProfiles: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    reduxPage: state.links.runsPage,
    fetching: state.links.fetching,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setRuns: (linksList, params, count, pages) =>
        dispatch(setRuns(linksList, true, params, count, pages)),
    redirectTo: (key, params) =>
        dispatch(push(`${key}${createUrl(params, '')}`)),
    setIsFetching: isFetching => dispatch(setIsFetching(isFetching)),
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
