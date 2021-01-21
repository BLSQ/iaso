import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { withStyles, Box } from '@material-ui/core';

import { fetchAllDataSources as fetchAllDataSourcesAction } from './actions';

import CustomTableComponent from '../../components/CustomTableComponent';
import TopBar from '../../components/nav/TopBarComponent';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';

import commonStyles from '../../styles/common';
import { baseUrls } from '../../constants/urls';

import dataSourcesTableColumns from './config';
import MESSAGES from './messages';

const baseUrl = baseUrls.sources;
const defaultOrder = 'name';

const styles = theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginTop: theme.spacing(4),
    },
});

class DataSources extends Component {
    componentDidMount() {
        const { params, fetchAllDataSources } = this.props;

        const requestParams = {
            pageSize: params.pageSize ? params.pageSize : 20,
            order: params.order ? params.order : `${defaultOrder}`,
            page: params.page ? params.page : 1,
        };
        fetchAllDataSources(requestParams);
    }

    componentDidUpdate(prevProps) {
        const { params, fetchAllDataSources } = this.props;

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

            fetchAllDataSources(requestParams);
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
                    title={formatMessage(MESSAGES.dataSources)}
                    displayBackButton={false}
                />
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <div className={classes.reactTable}>
                        <CustomTableComponent
                            isSortable
                            pageSize={20}
                            showPagination
                            columns={dataSourcesTableColumns(
                                formatMessage,
                                this,
                            )}
                            defaultSorted={[{ id: defaultOrder, desc: false }]}
                            params={params}
                            defaultPath={baseUrl}
                            dataKey="sources"
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
    fetchAllDataSources: PropTypes.func.isRequired,
    fetching: PropTypes.bool.isRequired,
    reduxPage: PropTypes.object,
};

const MapStateToProps = state => {
    return {
        fetching:
            state.dataSources !== undefined &&
            state.dataSources.fetching !== undefined
                ? state.dataSources.fetching
                : false,
        reduxPage: {
            ...state.dataSources,
            params: {},
        },
    };
};

const mapDispatchToProps = dispatch => ({
    dispatch,
    ...bindActionCreators(
        {
            fetchAllDataSources: fetchAllDataSourcesAction,
        },
        dispatch,
    ),
});

export default withStyles(styles)(
    connect(MapStateToProps, mapDispatchToProps)(injectIntl(DataSources)),
);
