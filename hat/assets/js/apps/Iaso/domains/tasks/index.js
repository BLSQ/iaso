import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { withStyles, Box } from '@material-ui/core';

import { fetchAllTasks as fetchAllTasksAction } from './actions';

import CustomTableComponent from '../../components/CustomTableComponent';
import TopBar from '../../components/nav/TopBarComponent';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';

import commonStyles from '../../styles/common';
import { baseUrls } from '../../constants/urls';

import tasksTableColumns from './config';
import MESSAGES from './messages';

const baseUrl = baseUrls.tasks;
const defaultOrder = 'created_at';

const styles = theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginTop: theme.spacing(4),
    },
});

class DataSources extends Component {
    componentDidMount() {
        const { params, fetchAllTasks } = this.props;

        const requestParams = {
            pageSize: params.pageSize ? params.pageSize : 20,
            order: params.order ? params.order : `${defaultOrder}`,
            page: params.page ? params.page : 1,
        };
        fetchAllTasks(requestParams);
    }

    componentDidUpdate(prevProps) {
        const { params, fetchAllTasks } = this.props;

        if (
            params.pageSize !== prevProps.params.pageSize ||
            params.order !== prevProps.params.order ||
            params.page !== prevProps.params.page
        ) {
            const requestParams = {
                pageSize: params.pageSize ? params.pageSize : 20,
                order: params.order ? params.order : `${defaultOrder}`,
                page: params.page ? params.page : 1,
            };

            fetchAllTasks(requestParams);
        }
    }

    render() {
        const {
            classes,
            params,
            reduxPage,
            intl: { formatMessage },
            fetching,
        } = this.props;

        return (
            <>
                {fetching && <LoadingSpinner />}
                <TopBar
                    title={formatMessage(MESSAGES.tasks)}
                    displayBackButton={false}
                />
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <div className={classes.reactTable}>
                        <CustomTableComponent
                            isSortable
                            pageSize={20}
                            showPagination
                            columns={tasksTableColumns(formatMessage, this)}
                            defaultSorted={[{ id: defaultOrder, desc: false }]}
                            params={params}
                            defaultPath={baseUrl}
                            dataKey="tasks"
                            multiSort={false}
                            fetchDatas={false}
                            canSelect
                            reduxPage={reduxPage}
                        />
                    </div>
                </Box>
            </>
        );
    }
}

DataSources.defaultProps = {
    reduxPage: undefined,
};

DataSources.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    fetchAllTasks: PropTypes.func.isRequired,
    fetching: PropTypes.bool.isRequired,
    reduxPage: PropTypes.object,
};

const MapStateToProps = state => ({
    fetching:
        state.tasks !== undefined && state.tasks.fetching !== undefined
            ? state.tasks.fetching
            : false,
    reduxPage: {
        ...state.tasks,
        params: {},
    },
});

const mapDispatchToProps = dispatch => ({
    dispatch,
    ...bindActionCreators(
        {
            fetchAllTasks: fetchAllTasksAction,
        },
        dispatch,
    ),
});

export default withStyles(styles)(
    connect(MapStateToProps, mapDispatchToProps)(injectIntl(DataSources)),
);
