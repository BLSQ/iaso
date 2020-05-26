import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { withStyles, Checkbox } from '@material-ui/core';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import ReactTable, { ReactTableDefaults } from 'react-table';
import { withRouter } from 'react-router';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';

import { getSort, getOrderArray } from '../../utils/tableUtils';


import { redirectTo as redirectToAction } from '../../routing/actions';
import { formatThousand } from '../../../../utils';
import commonStyles from '../../styles/common';
import customTableTranslations from '../../../../utils/constants/customTableTranslations';
import SelectionSpeedDials from './SelectionSpeedDials';

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
        marginBottom: theme.spacing(4),
        minHeight: 100,
        position: 'relative',
    },
    reactTableNoMarginTop: {
        marginTop: 0,
    },
    reactTableNoPaginationCountBottom: {
        marginBottom: theme.spacing(8),
    },
    countBottom: {
        position: 'absolute',
        bottom: -4,
        right: theme.spacing(4),
    },
    countBottomNoPagination: {
        bottom: 'auto',
        right: theme.spacing(2),
        top: 'calc(100% + 19px)',
    },
});
const getSimplifiedColumns = (columns) => {
    const newColumns = [];
    columns.forEach((c) => {
        if (c.accessor) {
            newColumns.push(c.accessor);
        }
    });
    return newColumns;
};

class Table extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectionArray: [],
        };
    }

    componentWillMount() {
        const {
            intl: { formatMessage },
        } = this.props;
        Object.assign(ReactTableDefaults, customTableTranslations(formatMessage));
    }

    shouldComponentUpdate(nextProps, nextState) {
        const newColumns = getSimplifiedColumns(nextProps.columns);
        const oldColumns = getSimplifiedColumns(this.props.columns);
        return !isEqual(nextProps.data, this.props.data)
        || !isEqual(newColumns, oldColumns)
        || !isEqual(nextState.selectionArray, this.state.selectionArray);
    }

    onTableParamsChange(key, value) {
        const { params, redirectTo, baseUrl } = this.props;
        redirectTo(baseUrl, {
            ...params,
            [key]: key !== 'order' ? value : getSort(value),
        });
    }

    onSelect(isSelected, item) {
        const selectionArray = [...this.state.selectionArray];
        if (isSelected) {
            selectionArray.push(item);
        } else {
            const itemIndex = selectionArray.findIndex(el => isEqual(el, item));
            selectionArray.splice(itemIndex, 1);
        }
        this.setState({
            selectionArray,
        });
    }

    isItemSelected(item) {
        const { selectionArray } = this.state;
        return Boolean(selectionArray.find(el => isEqual(el, item)));
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
            countOnTop,
            marginTop,
            multiSelect,
            intl: {
                formatMessage,
            },
            selectionActions,
        } = this.props;

        const { selectionArray } = this.state;
        let pageSize = parseInt(params.pageSize, 10) < count
            ? params.pageSize
            : count;
        if (count === 0) {
            pageSize = 2;
        }
        const order = params.order ? getOrderArray(params.order) : defaultSorted;
        const showPagination = parseInt(params.pageSize, 10) < count;
        if (multiSelect) {
            columns.push(
                {
                    Header: formatMessage({
                        id: 'iaso.label.selection',
                        defaultMessage: 'Selection',
                    }),
                    accessor: 'selected',
                    width: 100,
                    sorttable: false,
                    Cell: settings => (
                        <Checkbox
                            color="primary"
                            checked={this.isItemSelected(settings.original)}
                            onChange={event => this.onSelect(event.target.checked, settings.original)}
                        />
                    ),
                },
            );
        }

        return (
            <>
                <SelectionSpeedDials
                    hidden={selectionArray.length === 0}
                    items={selectionArray}
                    actions={selectionActions}
                />
                <div
                    className={classNames(classes.reactTable, {
                        [classes.reactTableNoPaginationCountBottom]: !countOnTop && !showPagination,
                        [classes.reactTableNoMarginTop]: !marginTop,
                    })}
                >
                    <div

                        className={classNames(classes.count, {
                            [classes.countBottom]: !countOnTop,
                            [classes.countBottomNoPagination]: !showPagination,
                        })}
                    >
                        {count > 0 && (
                            <div>
                                {
                                    selectionArray.length > 0
                                && (
                                    <span>
                                        {`${formatThousand(selectionArray.length)} `}
                                        <FormattedMessage
                                            id="iaso.label.selected"
                                            defaultMessage="selected"
                                        />
                                        {' - '}
                                    </span>
                                )
                                }
                                {`${formatThousand(count)} `}
                                <FormattedMessage
                                    id="table.results_"
                                    defaultMessage="résultat(s)"
                                />
                            </div>
                        )}
                    </div>

                    <ReactTable
                        showPagination={showPagination}
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
            </>
        );
    }
}
Table.defaultProps = {
    count: 0,
    defaultSorted: [
        { id: 'updated_at', desc: true },
    ],
    baseUrl: '',
    countOnTop: true,
    marginTop: true,
    multiSelect: false,
    selectionActions: [],
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
    countOnTop: PropTypes.bool,
    marginTop: PropTypes.bool,
    multiSelect: PropTypes.bool,
    selectionActions: PropTypes.array,
};

const MapDispatchToProps = dispatch => ({
    ...bindActionCreators({
        redirectTo: redirectToAction,
    }, dispatch),
});

export default withStyles(styles)(
    connect(() => ({}), MapDispatchToProps)(injectIntl(withRouter(Table))),
);
