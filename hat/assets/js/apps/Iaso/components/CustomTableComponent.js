import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { replace } from 'react-router-redux';
import { FormattedMessage } from 'react-intl';
import ReactTable, { ReactTableDefaults } from 'react-table';
import ReactResizeDetector from 'react-resize-detector';
import { getRequest, createUrl } from '../utils/fetchData';
import customTableTranslations from '../constants/customTableTranslations';
import { formatThousand } from '../utils';
import injectIntl from '../libs/intl/injectIntl';

const getOrderValue = obj => (!obj.desc ? obj.id : `-${obj.id}`);

const getOrderArray = orders =>
    orders.split(',').map(stringValue => ({
        id: stringValue.replace('-', ''),
        desc: stringValue.indexOf('-') !== -1,
    }));

class CustomTableComponent extends React.Component {
    constructor(props) {
        super(props);
        const orderArray = props.params[props.orderKey]
            ? getOrderArray(props.params[props.orderKey])
            : props.defaultSorted;
        const { formatMessage } = this.props.intl;
        this.state = {
            disableHeaderFixed: props.disableHeaderFixed,
            data: [],
            pages: null,
            loading: false,
            showPagination: false,
            page: props.params[props.pageKey]
                ? parseInt(props.params[props.pageKey], 10)
                : parseInt(props.page, 10),
            pageSize: props.params[props.pageSizeKey]
                ? parseInt(props.params[props.pageSizeKey], 10)
                : parseInt(props.pageSize, 10),
            order: orderArray,
            count: undefined,
            isHeaderFixed: false,
            tableId: `custom-table${+new Date()}`,
            reduxDatas: props.reduxPage.list,
        };
        Object.assign(
            ReactTableDefaults,
            customTableTranslations(formatMessage),
        );
    }

    componentDidMount() {
        window.addEventListener('scroll', () => this.handleScroll());
        if (!this.props.reduxPage.list && this.props.fetchDatas) {
            this.onFetchData(
                {
                    sorted: this.state.order,
                    page: this.state.page,
                    pageSize: this.state.pageSize,
                },
                this.props.endPointUrl,
            );
        }
    }

    componentWillReceiveProps(newProps) {
        this.handleScroll();
        if (
            (newProps.endPointUrl !== this.props.endPointUrl ||
                newProps.params[newProps.pageSizeKey] !==
                    this.props.params[this.props.pageSizeKey] ||
                newProps.params[newProps.pageKey] !==
                    this.props.params[this.props.pageKey] ||
                newProps.params[newProps.orderKey] !==
                    this.props.params[newProps.orderKey] ||
                newProps.isUpdated) &&
            newProps.fetchDatas
        ) {
            const orderArray = newProps.params[newProps.orderKey]
                ? getOrderArray(newProps.params[newProps.orderKey])
                : this.props.defaultSorted;
            this.onFetchData(
                {
                    sorted: orderArray,
                    page: newProps.params[newProps.pageKey]
                        ? parseInt(newProps.params[newProps.pageKey], 10)
                        : parseInt(this.props.page, 10),
                    pageSize: newProps.params[newProps.pageSizeKey]
                        ? parseInt(newProps.params[newProps.pageSizeKey], 10)
                        : parseInt(this.props.pageSize, 10),
                },
                newProps.endPointUrl,
            );
        }

        if (newProps.reduxPage.list && newProps.reduxPage.params) {
            const pageSize =
                newProps.reduxPage.params[newProps.pageSizeKey] ||
                parseInt(newProps.pageSize, 10);
            let { showPagination } = newProps.reduxPage;
            if (newProps.reduxPage.count) {
                showPagination =
                    newProps.showPagination &&
                    newProps.reduxPage.count > pageSize;
            }
            if (!newProps.reduxPage.pages || newProps.reduxPage.count === 0) {
                showPagination = false;
            }
            this.setState({
                reduxDatas: newProps.reduxPage.list,
                loading: false,
                page:
                    newProps.reduxPage.params[newProps.pageKey] ||
                    parseInt(newProps.page, 10),
                pageSize,
                pages: newProps.reduxPage.pages,
                showPagination,
                count: newProps.reduxPage.count,
            });
        }
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', () => this.handleScroll());
    }

    onChangeSort(sortList) {
        let orderTemp = '';
        sortList.map((sort, index) => {
            orderTemp += `${index > 0 ? ',' : ''}${getOrderValue(sort)}`;
            return true;
        });
        if (orderTemp !== this.props.params[this.props.orderKey]) {
            const newParams = {
                ...this.props.params,
            };
            newParams[this.props.orderKey] = orderTemp;
            this.props.redirectTo(this.props.defaultPath, newParams);
        }
    }

    onPageSizeChange(pageSize) {
        const newParams = {
            ...this.props.params,
        };
        newParams[this.props.pageSizeKey] = pageSize;
        newParams[this.props.pageKey] = 1;
        this.props.redirectTo(this.props.defaultPath, newParams);
    }

    onPageChange(page) {
        const newParams = {
            ...this.props.params,
        };
        newParams[this.props.pageKey] = page + 1;
        this.props.redirectTo(this.props.defaultPath, newParams);
    }

    onFetchData(settings, url = this.props.endPointUrl) {
        this.props.onDataStartLoaded();
        let orderTemp = '';
        settings.sorted.map((sort, index) => {
            orderTemp += `${index > 0 ? ',' : ''}${getOrderValue(sort)}`;
            return true;
        });
        this.setState({
            loading: true,
        });
        getRequest(
            `${url}&order=${orderTemp}&limit=${settings.pageSize}&page=${settings.page}`,
            this.props.dispatch,
            null,
            this.props.displayLoader,
        ).then(data => {
            const tempdata = this.props.dataKey
                ? data[this.props.dataKey]
                : data;
            if (this.props.callBackWithDataKey) {
                this.props.onDataLoaded(
                    tempdata,
                    parseInt(data.count, 10),
                    data.pages,
                );
            } else {
                this.props.onDataLoaded(
                    data,
                    parseInt(data.count, 10),
                    data.pages,
                );
            }
            let { showPagination } = this.props;
            if (data.count || data.count === 0) {
                showPagination =
                    this.props.showPagination && data.count > settings.pageSize;
            }
            if (!data.pages) {
                showPagination = false;
            }
            setTimeout(() => {
                this.setState({
                    page: settings.page,
                    pageSize: settings.pageSize,
                    data: tempdata,
                    pages: data.pages,
                    loading: false,
                    showPagination,
                    count: parseInt(data.count, 10),
                });
            }, 200);
        });
        this.props.onDataUpdated(false);
    }

    onRowClicked(state, rowInfo, column) {
        return {
            onClick: e => {
                e.preventDefault();
                if (column.id !== 'actions') {
                    this.props.onRowClicked(rowInfo.original, state, e);
                }
            },
        };
    }

    onResize(width) {
        const currentTable = document.getElementById(this.state.tableId);
        const currentTableBody = currentTable.getElementsByClassName(
            'rt-tbody',
        )[0];
        this.setState({
            disableHeaderFixed:
                currentTableBody.clientWidth > width
                    ? true
                    : this.props.disableHeaderFixed,
            isHeaderFixed: currentTableBody.clientWidth === width,
        });
        this.handleScroll();
        if (currentTable) {
            const header = currentTable.getElementsByClassName('-header')[0];
            if (header && width) {
                if (currentTableBody.clientWidth <= width) {
                    header.setAttribute(
                        'style',
                        `width:${currentTable.clientWidth - 2}px;`,
                    );
                } else {
                    header.setAttribute(
                        'style',
                        `width:${currentTableBody.clientWidth - 2}px;`,
                    );
                }
            }
        }
    }

    handleScroll() {
        const lastScrollY = window.scrollY;
        const currentTable = document.getElementById(this.state.tableId);
        if (currentTable) {
            let topPosition = currentTable.offsetTop;
            const headerGroups = currentTable.getElementsByClassName(
                '-headerGroups',
            )[0];
            if (headerGroups) {
                topPosition += headerGroups.clientHeight;
            }
            this.setState({
                isHeaderFixed:
                    !this.state.disableHeaderFixed && lastScrollY > topPosition,
            });
        }
    }

    render() {
        const data = this.state.reduxDatas
            ? this.state.reduxDatas
            : this.state.data;
        const { showPagination } = this.state;
        let currentPageSize =
            showPagination || (!showPagination && data.length === 0)
                ? this.state.pageSize
                : data.length;
        if (data.length === 0) {
            currentPageSize = 2;
        }
        let extraProps;

        if (this.props.canSelect) {
            extraProps = {
                getTdProps: (state, rowInfo, column) =>
                    this.onRowClicked(state, rowInfo, column),
            };
        } else {
            extraProps = {
                SubComponent: this.props.SubComponent
                    ? this.props.SubComponent
                    : null,
            };
            if (this.props.expanded) {
                extraProps.expanded = { ...this.props.expanded };
                extraProps.onExpandedChange = (newExpanded, index, event) =>
                    this.props.onExpandedChange(newExpanded, index, event);
            }
        }
        return (
            <ReactResizeDetector
                handleWidth
                onResize={width => this.onResize(width, this.state.tableId)}
            >
                <section
                    id={this.state.tableId}
                    className={`custom-table-container ${
                        this.props.selectable ? 'selectable' : ''
                    } ${
                        !showPagination && this.state.count
                            ? 'no-pagination'
                            : ''
                    } ${this.state.isHeaderFixed ? 'header-fixed' : ''} `}
                >
                    <ReactTable
                        showPagination={showPagination}
                        manual
                        multiSort={this.props.multiSort}
                        columns={this.props.columns}
                        data={data}
                        pages={this.state.pages}
                        loading={this.state.loading}
                        onPageChange={page => this.onPageChange(page)}
                        onPageSizeChange={pageSize =>
                            this.onPageSizeChange(pageSize)
                        }
                        onSortedChange={sort => this.onChangeSort(sort)}
                        filterable={this.props.isFilterable}
                        sortable={this.props.isSortable}
                        pageSize={currentPageSize}
                        page={this.state.page - 1}
                        className={`-striped -highlight ${
                            !this.props.withBorder ? 'no-border' : ''
                        } ${!this.props.canSelect ? 'no-select' : ''}`}
                        defaultSorted={this.state.order}
                        pageSizeOptions={[5, 10, 20, 25, 50, 100, 150, 200]}
                        {...extraProps}
                    />
                    <div className="count-container">
                        {this.state.count !== undefined &&
                            this.state.count > 0 && (
                                <div>
                                    {`${formatThousand(this.state.count)} `}
                                    <FormattedMessage
                                        id="table.results_"
                                        defaultMessage="résultat(s)"
                                    />
                                </div>
                            )}
                    </div>
                </section>
            </ReactResizeDetector>
        );
    }
}

CustomTableComponent.defaultProps = {
    isFilterable: false,
    isSortable: false,
    pageSize: 1,
    page: 1,
    endPointUrl: '',
    onRowClicked: () => null,
    showPagination: false,
    defaultSorted: [],
    defaultPath: '',
    dataKey: null,
    multiSort: false,
    selectable: false,
    withBorder: true,
    onDataStartLoaded: () => null,
    onDataLoaded: () => null,
    onDataUpdated: () => null,
    onExpandedChange: () => null,
    isUpdated: false,
    callBackWithDataKey: true,
    disableHeaderFixed: false,
    reduxPage: {
        list: null,
        params: {},
        showPagination: false,
        count: 0,
        pages: 0,
    },
    fetchDatas: true,
    pageKey: 'page',
    pageSizeKey: 'pageSize',
    orderKey: 'order',
    canSelect: true,
    displayLoader: true,
    SubComponent: null,
    expanded: null,
};

CustomTableComponent.propTypes = {
    isFilterable: PropTypes.bool,
    isSortable: PropTypes.bool,
    pageSize: PropTypes.number,
    page: PropTypes.number,
    endPointUrl: PropTypes.string,
    columns: PropTypes.arrayOf(PropTypes.object).isRequired,
    params: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    onRowClicked: PropTypes.func,
    showPagination: PropTypes.bool,
    defaultSorted: PropTypes.arrayOf(PropTypes.object),
    defaultPath: PropTypes.string,
    redirectTo: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    dataKey: PropTypes.string,
    multiSort: PropTypes.bool,
    selectable: PropTypes.bool,
    onDataStartLoaded: PropTypes.func,
    onDataLoaded: PropTypes.func,
    onDataUpdated: PropTypes.func,
    withBorder: PropTypes.bool,
    isUpdated: PropTypes.bool,
    callBackWithDataKey: PropTypes.bool,
    disableHeaderFixed: PropTypes.bool,
    reduxPage: PropTypes.object,
    fetchDatas: PropTypes.bool,
    pageKey: PropTypes.string,
    pageSizeKey: PropTypes.string,
    orderKey: PropTypes.string,
    canSelect: PropTypes.bool,
    displayLoader: PropTypes.bool,
    SubComponent: PropTypes.any,
    expanded: PropTypes.any,
    onExpandedChange: PropTypes.func,
};

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) =>
        dispatch(replace(`${key}${createUrl(params, '')}`)),
});

const CustomTableComponentIntl = injectIntl(CustomTableComponent);

export default connect(null, MapDispatchToProps)(CustomTableComponentIntl);
