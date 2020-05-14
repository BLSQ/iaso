import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { withStyles } from '@material-ui/core';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import ReactTable, { ReactTableDefaults } from 'react-table';
import { withRouter } from 'react-router';
import isEqual from 'lodash/isEqual';

import { getSort, getOrderArray } from '../../utils/tableUtils';


import { redirectTo as redirectToAction } from '../../routing/actions';
import { formatThousand } from '../../../../utils';
import commonStyles from '../../styles/common';
import customTableTranslations from '../../../../utils/constants/customTableTranslations';

/**
* Table component, no redux (only for redirect), no fetch, just displaying
* Required props in order to work:
* @param {Object} params
* @param {Array} data
* @param {Array} columns
* @param {Number} pages
*
*Optionnal props:
* @param {Number} count
* @param {String} baseUrl
* @param {Array} defaultSorted
*/

const styles = theme => ({
    ...commonStyles(theme),
    count: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: theme.spacing(2),
    },
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginTop: theme.spacing(4),
    },
});

class Table extends Component {
    componentDidMount() {
        const {
            intl: { formatMessage },
        } = this.props;
        Object.assign(ReactTableDefaults, customTableTranslations(formatMessage));
    }

    shouldComponentUpdate(nextProps) {
        return !isEqual(nextProps.data, this.props.data);
    }

    onTableParamsChange(key, value) {
        const { params, redirectTo, baseUrl } = this.props;
        redirectTo(baseUrl, {
            ...params,
            [key]: key !== 'order' ? value : getSort(value),
        });
    }

    render() {
        const {
            classes,
            params,
            data,
            count,
            pages,
            columns,
            defaultSorted,
        } = this.props;
        const pageSize = parseInt(params.pageSize, 10) < count
            ? params.pageSize
            : count;

        const order = params.order ? getOrderArray(params.order) : defaultSorted;
        return (
            <div className={classes.reactTable}>
                <div className={classes.count}>
                    {count > 0 && (
                        <div>
                            {`${formatThousand(count)} `}
                            <FormattedMessage
                                id="table.results_"
                                defaultMessage="résultat(s)"
                            />
                        </div>
                    )}
                </div>
                <ReactTable
                    showPagination={parseInt(params.pageSize, 10) < count}
                    multiSort
                    manual
                    columns={columns}
                    data={data}
                    pages={pages}
                    className="-striped -highlight"
                    defaultSorted={order}
                    pageSize={pageSize}
                    page={params.page - 1}
                    onPageChange={page => this.onTableParamsChange('page', page + 1)}
                    onPageSizeChange={newPageSize => this.onTableParamsChange('pageSize', newPageSize)}
                    onSortedChange={newOrder => this.onTableParamsChange('order', newOrder)}
                />
            </div>
        );
    }
}
Table.defaultProps = {
    count: 0,
    defaultSorted: [
        { id: 'updated_at', desc: true },
    ],
    baseUrl: '',
};

Table.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    data: PropTypes.array.isRequired,
    columns: PropTypes.array.isRequired,
    count: PropTypes.number,
    pages: PropTypes.number.isRequired,
    defaultSorted: PropTypes.array,
    baseUrl: PropTypes.string,
};

const MapDispatchToProps = dispatch => ({
    ...bindActionCreators({
        redirectTo: redirectToAction,
    }, dispatch),
});

export default withStyles(styles)(
    connect(() => ({}), MapDispatchToProps)(injectIntl(withRouter(Table))),
);
