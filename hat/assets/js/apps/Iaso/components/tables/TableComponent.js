import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { withStyles, Checkbox } from '@material-ui/core';
import PropTypes from 'prop-types';
import ReactTable, { ReactTableDefaults } from 'react-table';
import { withRouter } from 'react-router';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';

import {
    getSort,
    getOrderArray,
    getSimplifiedColumns,
    defaultSelectionActions,
    selectionInitialState,
    getParamsKey,
    getColumnsHeadersInfos,
} from '../../utils/tableUtils';

import { formatThousand } from '../../utils';
import commonStyles from '../../styles/common';
import customTableTranslations from '../../constants/customTableTranslations';
import SelectionSpeedDials from './SelectionSpeedDials';
import MESSAGES from './messages';
import injectIntl from '../../libs/intl/injectIntl';

/**
 * Table component, no redux, no fetch, just displaying.
 * Multi selection is optionnal, if set to true you can add custom actions
 * Required props in order to work:
 * @param {Object} params
 * @param {Array} data
 * @param {Array} columns
 * @param {Number} pages
 * @param {Function} redirectTo
 *
 * Optionnal props:
 * @param {Number} count
 * @param {String} baseUrl
 * @param {Array} defaultSorted
 * @param {Array} marginTop
 * @param {Array} countOnTop
 * @param {Object} extraProps
 * @param {String} paramPrefix
 *
 * Multi selection is optionnal
 * Selection props:
 * @param {Boolean} multiSelect
 * if set to true you can add custom actions, an array of object(s):
 *   @param {Array} selectionActions
 *       @param {Array} icon
 *       @param {String} label
 *       @param {Function} onClick
 *       @param {Boolean} disabled
 * You need aslo to maintain selection state in parent component
 * You can use selectionInitialState and setTableSelection from Iaso/utils/tableUtils.js
 *   @param {Object} selection
 *   @param {Function} setTableSelection
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

class Table extends Component {
    constructor(props) {
        super(props);
        const {
            intl: { formatMessage },
            setTableSelection,
        } = props;
        setTableSelection('reset');
        Object.assign(
            ReactTableDefaults,
            customTableTranslations(formatMessage),
        );
    }

    shouldComponentUpdate(nextProps) {
        const newColumns = getSimplifiedColumns(nextProps.columns);
        const oldColumns = getSimplifiedColumns(this.props.columns);
        return (
            !isEqual(nextProps.data, this.props.data) ||
            !isEqual(newColumns, oldColumns) ||
            !isEqual(
                nextProps.selection.selectedItems,
                this.props.selection.selectedItems,
            ) ||
            !isEqual(
                nextProps.selection.selectAll,
                this.props.selection.selectAll,
            ) ||
            !isEqual(
                nextProps.selection.unSelectedItems,
                this.props.selection.unSelectedItems,
            ) ||
            !isEqual(nextProps.extraProps, this.props.extraProps)
        );
    }

    componentWillUnmount() {
        this.props.setTableSelection('reset');
    }

    onTableParamsChange(key, value) {
        const { params, redirectTo, baseUrl, paramsPrefix } = this.props;
        const newParams = {
            ...params,
            [getParamsKey(paramsPrefix, key)]:
                key !== 'order' ? value : getSort(value),
        };
        if (key === 'pageSize') {
            newParams[getParamsKey(paramsPrefix, 'page')] = 1;
        }
        redirectTo(baseUrl, newParams);
    }

    onSelect(isSelected, item) {
        const selectedItems = [...this.props.selection.selectedItems];
        const unSelectedItems = [...this.props.selection.unSelectedItems];
        const {
            selection: { selectAll },
            count,
            setTableSelection,
        } = this.props;
        if (selectAll) {
            if (!isSelected) {
                unSelectedItems.push(item);
            } else {
                const itemIndex = unSelectedItems.findIndex(el =>
                    isEqual(el, item),
                );
                if (itemIndex !== -1) {
                    unSelectedItems.splice(itemIndex, 1);
                }
            }
            setTableSelection('unselect', unSelectedItems, count);
        } else {
            if (isSelected) {
                selectedItems.push(item);
            } else {
                const itemIndex = selectedItems.findIndex(el =>
                    isEqual(el, item),
                );
                selectedItems.splice(itemIndex, 1);
            }
            setTableSelection('select', selectedItems);
        }
    }

    isItemSelected(item) {
        const {
            selection: { selectedItems, unSelectedItems, selectAll },
        } = this.props;
        if (!selectAll) {
            return Boolean(selectedItems.find(el => isEqual(el, item)));
        }
        return !unSelectedItems.find(el => isEqual(el, item));
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
            intl: { formatMessage },
            selectionActions,
            setTableSelection,
            selection: { selectCount },
            selection,
            extraProps,
            paramsPrefix,
        } = this.props;

        let actions = [
            ...defaultSelectionActions(
                () => setTableSelection('selectAll', [], count),
                () => setTableSelection('reset'),
                formatMessage,
            ),
        ];
        actions = actions.concat(selectionActions);
        const page = params[getParamsKey(paramsPrefix, 'page')]
            ? params[getParamsKey(paramsPrefix, 'page')] - 1
            : 0;
        const urlPageSize = parseInt(
            params[getParamsKey(paramsPrefix, 'pageSize')],
            10,
        );
        let pageSize =
            urlPageSize || (extraProps && extraProps.defaultPageSize);
        const showPagination = !(pageSize >= count && page === 0);
        pageSize = pageSize < count ? pageSize : count;
        if (count === 0) {
            pageSize = 2;
        }
        const order = params[getParamsKey(paramsPrefix, 'order')]
            ? getOrderArray(params[getParamsKey(paramsPrefix, 'order')])
            : defaultSorted;
        if (multiSelect && !columns.find(c => c.accessor === 'selected')) {
            columns.push({
                Header: formatMessage(MESSAGES.selection),
                accessor: 'selected',
                width: 100,
                sorttable: false,
                Cell: settings => (
                    <Checkbox
                        color="primary"
                        checked={this.isItemSelected(settings.original)}
                        onChange={event =>
                            this.onSelect(
                                event.target.checked,
                                settings.original,
                            )
                        }
                    />
                ),
            });
        }
        return (
            <>
                <SelectionSpeedDials
                    selection={selection}
                    hidden={!multiSelect}
                    actions={actions}
                    reset={() => setTableSelection('reset')}
                />
                <div
                    className={classNames(classes.reactTable, {
                        [classes.reactTableNoPaginationCountBottom]:
                            !countOnTop && !showPagination,
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
                                {selectCount > 0 && (
                                    <span>
                                        {`${formatThousand(selectCount)} `}
                                        <FormattedMessage
                                            {...MESSAGES.selected}
                                        />
                                        {' - '}
                                    </span>
                                )}
                                {`${formatThousand(count)} `}
                                <FormattedMessage {...MESSAGES.results} />
                            </div>
                        )}
                    </div>

                    <ReactTable
                        showPagination={showPagination}
                        multiSort
                        manual
                        columns={getColumnsHeadersInfos(columns)}
                        data={data}
                        pages={pages}
                        className="-striped -highlight"
                        defaultSorted={order}
                        pageSize={pageSize}
                        page={page}
                        onPageChange={newPage =>
                            this.onTableParamsChange('page', newPage + 1)
                        }
                        onPageSizeChange={newPageSize =>
                            this.onTableParamsChange('pageSize', newPageSize)
                        }
                        onSortedChange={newOrder =>
                            this.onTableParamsChange('order', newOrder)
                        }
                        {...extraProps}
                    />
                </div>
            </>
        );
    }
}
Table.defaultProps = {
    count: 0,
    defaultSorted: [{ id: 'updated_at', desc: true }],
    baseUrl: '',
    countOnTop: true,
    marginTop: true,
    multiSelect: false,
    selectionActions: [],
    selection: selectionInitialState,
    setTableSelection: () => null,
    extraProps: null,
    paramsPrefix: '',
    params: {
        pageSize: 10,
        page: 1,
        order: '-created_at',
    },
};

Table.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    params: PropTypes.object,
    count: PropTypes.number,
    pages: PropTypes.number.isRequired,
    defaultSorted: PropTypes.array,
    data: PropTypes.array.isRequired,
    columns: PropTypes.array.isRequired,
    baseUrl: PropTypes.string,
    countOnTop: PropTypes.bool,
    marginTop: PropTypes.bool,
    multiSelect: PropTypes.bool,
    selectionActions: PropTypes.array,
    redirectTo: PropTypes.func.isRequired,
    setTableSelection: PropTypes.func,
    selection: PropTypes.object,
    extraProps: PropTypes.object,
    paramsPrefix: PropTypes.string,
};

export default withStyles(styles)(injectIntl(withRouter(Table)));
