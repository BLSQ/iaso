import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { push } from 'react-router-redux';

import {
    withStyles, Box,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import {
    fetchAlgorithms,
    deleteAlgorithmRun,
} from '../utils/requests';

import {
    setRuns,
    setIsFetching,
    setAlgorithms,
} from '../redux/linksReducer';

import runsTableColumns from '../constants/runsTableColumns';

import { createUrl } from '../../../utils/fetchData';
import getTableUrl from '../utils/tableUtils';


import TopBar from '../components/nav/TopBarComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';
import LoadingSpinner from '../components/LoadingSpinnerComponent';
import RunsFiltersComponent from '../components/filters/RunsFiltersComponent';

import commonStyles from '../styles/common';

const baseUrl = 'links/runs';

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
        const { dispatch } = this.props;
        if (this.props.params.searchActive) {
            this.onSearch();
        }
        fetchAlgorithms(dispatch)
            .then(algoList => this.props.setAlgorithms(algoList));
    }

    componentDidUpdate() {
        if (!this.props.params.searchActive && this.props.reduxPage.list) {
            this.resetData();
        }
    }

    componentWillUnmount() {
        this.props.setRuns(null, this.props.params, 0, 1);
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
        deleteAlgorithmRun(dispatch, run.id).then(() => {
            this.onRefresh();
        });
    }

    render() {
        const {
            classes,
            params,
            reduxPage,
            intl: {
                formatMessage,
            },
            dispatch,
            fetching,
        } = this.props;
        const {
            tableUrl,
            tableColumns,
            isUpdated,
        } = this.state;

        return (
            <Fragment>
                {
                    fetching
                    && <LoadingSpinner />
                }
                <TopBar title={formatMessage({
                    defaultMessage: 'Algorithms runs',
                    id: 'iaso.label.algorithmsRuns',
                })}
                />
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <RunsFiltersComponent
                        baseUrl={baseUrl}
                        params={params}
                        onSearch={() => this.onSearch()}
                        onRefresh={() => this.onRefresh()}
                    />
                    {
                        tableUrl && (
                            <Fragment>
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
                                        onDataStartLoaded={() => this.onDataStartLoaded()}
                                        onDataLoaded={(list, count, pages) => {
                                            dispatch(this.props.setIsFetching(false));
                                            this.props.setRuns(list, this.props.params, count, pages);
                                        }}
                                        reduxPage={reduxPage}
                                        isUpdated={isUpdated}
                                    />
                                </div>
                            </Fragment>
                        )
                    }
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
};

const MapStateToProps = state => ({
    reduxPage: state.links.runsPage,
    fetching: state.links.fetching,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setRuns: (linksList, params, count, pages) => dispatch(setRuns(linksList, true, params, count, pages)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    setIsFetching: isFetching => dispatch(setIsFetching(isFetching)),
    setAlgorithms: algoList => dispatch(setAlgorithms(algoList)),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(Runs)),
);
