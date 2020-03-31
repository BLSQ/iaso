import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { withStyles, Box } from '@material-ui/core';
import PropTypes from 'prop-types';
import ReactTable, { ReactTableDefaults } from 'react-table';
import isEqual from 'lodash/isEqual';

import { bindActionCreators } from 'redux';
import { redirectTo as redirectToAction } from '../../routing/actions';
import { fetchMappings as fetchMappingsAction } from './actions';

import TopBar from '../../components/nav/TopBarComponent';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';

import mappingsTableColumns from './config';
import { getSort } from './utils';

import { formatThousand } from '../../../../utils';
import commonStyles from '../../styles/common';
import customTableTranslations from '../../../../utils/constants/customTableTranslations';

const baseUrl = 'settings/mappings';

const styles = theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginTop: theme.spacing(4),
    },
});

class Mappings extends Component {
    componentDidMount() {
        const { intl: { formatMessage }, fetchMappings, params } = this.props;
        fetchMappings(params);
        Object.assign(ReactTableDefaults, customTableTranslations(formatMessage));
    }

    componentDidUpdate(prevProps) {
        const { params, fetchMappings } = this.props;
        if (!isEqual(prevProps.params, params)) {
            fetchMappings(params);
        }
    }

    onTableParamsChange(key, value) {
        const { params, redirectTo } = this.props;
        redirectTo(baseUrl, {
            ...params,
            [key]: key !== 'order' ? value : getSort(value),
        });
    }


    render() {
        const {
            classes,
            params,
            intl: {
                formatMessage,
            },
            mappings,
            fetching,
            count,
            pages,
        } = this.props;
        const pageSize = parseInt(params.pageSize, 10) < mappings.length ? params.pageSize : mappings.length;
        return (
            <>
                {
                    fetching
                    && <LoadingSpinner />
                }
                <TopBar title={formatMessage({
                    defaultMessage: 'DHIS mappings',
                    id: 'iaso.label.dhis2Mappings',
                })}
                />
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <div className={classes.reactTable}>
                        <div className="count-container">
                            {count > 0
                                && (
                                    <div>
                                        {`${formatThousand(count)} `}
                                        <FormattedMessage
                                            id="table.results_"
                                            defaultMessage="résultat(s)"
                                        />
                                    </div>
                                )
                            }
                        </div>
                        <ReactTable
                            showPagination={parseInt(params.pageSize, 10) < count}
                            multiSort
                            manual
                            columns={mappingsTableColumns(formatMessage)}
                            data={mappings}
                            pages={pages}
                            className="-striped -highlight"
                            defaultSorted={[{ id: 'updated_at', desc: false }]}
                            pageSize={pageSize}
                            page={params.page - 1}
                            onPageChange={page => this.onTableParamsChange('page', page + 1)}
                            onPageSizeChange={newPageSize => this.onTableParamsChange('pageSize', newPageSize)}
                            onSortedChange={order => this.onTableParamsChange('order', order)}
                        />
                    </div>
                </Box>
            </>
        );
    }
}
Mappings.defaultProps = {
    count: 0,
};

Mappings.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    fetchMappings: PropTypes.func.isRequired,
    mappings: PropTypes.array.isRequired,
    count: PropTypes.number,
    fetching: PropTypes.bool.isRequired,
    pages: PropTypes.number.isRequired,
};

const MapStateToProps = state => ({
    mappings: state.mappings.mappings,
    count: state.mappings.count,
    pages: state.mappings.pages,
    fetching: state.mappings.fetching,
});

const MapDispatchToProps = dispatch => (

    {
        ...bindActionCreators({
            fetchMappings: fetchMappingsAction,
            redirectTo: redirectToAction,
        }, dispatch),
    }
);

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(Mappings)),
);
