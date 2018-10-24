import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import ReactTable, { ReactTableDefaults } from 'react-table';
import ReactResizeDetector from 'react-resize-detector';
import { getRequest, createUrl } from '../utils/fetchData';
import customTableTranslations from '../utils/constants/customTableTranslations';
import { formatThousand } from '../utils';

const getOrderValue = obj => (!obj.desc ? obj.id : `-${obj.id}`);

const getOrderArray = orders => (orders.split(',').map(stringValue => ({
    id: stringValue.replace('-', ''),
    desc: stringValue.indexOf('-') !== -1,
})));

class CustomTableComponent extends React.Component {
    constructor(props) {
        super(props);
        const orderArray = props.params.order ? getOrderArray(props.params.order) : props.defaultSorted;
        const { formatMessage } = this.props.intl;
        this.state = {
            disableHeaderFixed: props.disableHeaderFixed,
            data: [],
            pages: null,
            loading: true,
            showPagination: false,
            page: props.params.page ? parseInt(props.params.page, 10) : props.page,
            pageSize: props.params.pageSize ? parseInt(props.params.pageSize, 10) : props.pageSize,
            order: orderArray,
            count: undefined,
            isHeaderFixed: false,
            tableId: `custom-table${+new Date()}`,
        };
        Object.assign(ReactTableDefaults, customTableTranslations(formatMessage));
    }

    componentDidMount() {
        window.addEventListener('scroll', () => this.handleScroll());
        this.onFetchData({
            sorted: this.state.order,
            page: this.state.page,
            pageSize: this.state.pageSize,
        }, this.props.endPointUrl);
    }

    componentWillReceiveProps(newProps) {
        this.handleScroll();
        if ((newProps.endPointUrl !== this.props.endPointUrl) ||
            (newProps.params.pageSize !== this.props.params.pageSize) ||
            (newProps.params.page !== this.props.params.page) ||
            (newProps.params.order !== this.props.params.order) ||
            newProps.isUpdated) {
            const orderArray = newProps.params.order ?
                getOrderArray(newProps.params.order) : this.props.defaultSorted;
            this.onFetchData({
                sorted: orderArray,
                page: newProps.params.page ? parseInt(newProps.params.page, 10) : this.props.page,
                pageSize: newProps.params.pageSize ? parseInt(newProps.params.pageSize, 10) : this.props.pageSize,
            }, newProps.endPointUrl);
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
        if (orderTemp !== this.props.params.order) {
            this.props.redirectTo(this.props.defaultPath, {
                ...this.props.params,
                order: orderTemp,
            });
        }
    }

    onPageSizeChange(pageSize) {
        this.props.redirectTo(this.props.defaultPath, {
            ...this.props.params,
            pageSize,
            page: 1,
        });
    }

    onPageChange(page) {
        this.props.redirectTo(this.props.defaultPath, {
            ...this.props.params,
            page: page + 1,
        });
    }

    onFetchData(settings, url = this.props.endPointUrl) {
        let orderTemp = '';
        settings.sorted.map((sort, index) => {
            orderTemp += `${index > 0 ? ',' : ''}${getOrderValue(sort)}`;
            return true;
        });
        this.setState({
            loading: true,
        });
        getRequest(`${url}&order=${orderTemp}&limit=${settings.pageSize}&page=${settings.page}`, this.props.dispatch).then((data) => {
            const tempdata = this.props.dataKey ? data[this.props.dataKey] : data;
            if (this.props.callBackWithDataKey) {
                this.props.onDataLoaded(tempdata);
            } else {
                this.props.onDataLoaded(data);
            }
            let { showPagination } = this.props;
            if (data.count) {
                showPagination = this.props.showPagination && (data.count > settings.pageSize);
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

    onRowClicked(state, rowInfo) {
        return {
            onClick: (e) => {
                e.preventDefault();
                this.props.onRowClicked(rowInfo.original, state, e);
            },
        };
    }

    onResize(width) {
        const currentTable = document.getElementById(this.state.tableId);
        const currentTableBody = currentTable.getElementsByClassName('rt-tbody')[0];
        this.setState({
            disableHeaderFixed: currentTableBody.clientWidth > width ? true : this.props.disableHeaderFixed,
            isHeaderFixed: currentTableBody.clientWidth === width,
        });
        this.handleScroll();
        if (currentTable) {
            const header = currentTable.getElementsByClassName('-header')[0];
            if (header && width) {
                header.setAttribute('style', `width:${currentTableBody.clientWidth - 2}px;`);
            }
        }
    }

    handleScroll() {
        const lastScrollY = window.scrollY;
        const currentTable = document.getElementById(this.state.tableId);
        let topPosition = currentTable.offsetTop;
        const headerGroups = currentTable.getElementsByClassName('-headerGroups')[0];
        if (headerGroups) {
            topPosition += headerGroups.clientHeight;
        }
        this.setState({
            isHeaderFixed: !this.state.disableHeaderFixed && lastScrollY > topPosition,
        });
    }

    render() {
        const currentPageSize = this.state.showPagination || (!this.state.showPagination && this.state.data.length === 0) ? this.state.pageSize : this.state.data.length;
        return (
            <ReactResizeDetector handleWidth onResize={width => this.onResize(width, this.state.tableId)}>
                <section
                    id={this.state.tableId}
                    className={`custom-table-container ${this.props.selectable ?
                        'selectable' : ''} ${!this.state.showPagination && this.state.count ?
                        'no-pagination' : ''} ${this.state.isHeaderFixed ?
                        'header-fixed' : ''} `}
                >
                    <ReactTable
                        manual
                        multiSort={this.props.multiSort}
                        columns={this.props.columns}
                        data={this.state.data}
                        pages={this.state.pages}
                        loading={this.state.loading}
                        onPageChange={page => this.onPageChange(page)}
                        onPageSizeChange={pageSize => this.onPageSizeChange(pageSize)}
                        onSortedChange={sort => this.onChangeSort(sort)}
                        filterable={this.props.isFilterable}
                        sortable={this.props.isSortable}
                        pageSize={currentPageSize}
                        page={this.state.page - 1}
                        className={`-striped -highlight ${!this.props.withBorder ? 'no-border' : ''}`}
                        getTdProps={(state, rowInfo) => this.onRowClicked(state, rowInfo)}
                        showPagination={this.state.showPagination}
                        defaultSorted={this.state.order}
                        pageSizeOptions={[5, 10, 20, 25, 50, 100, 150, 200]}
                    />
                    <div className="count-container">
                        {this.state.count !== undefined && this.state.count > 0 &&
                            <div>
                                {`${formatThousand(this.state.count)} `}
                                <FormattedMessage
                                    id="locator.list.result"
                                    defaultMessage="résultat(s)"
                                />
                            </div>
                        }
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
    onRowClicked: () => { },
    showPagination: false,
    defaultSorted: [],
    defaultPath: '',
    dataKey: null,
    multiSort: false,
    selectable: false,
    withBorder: true,
    onDataLoaded: () => { },
    onDataUpdated: () => { },
    isUpdated: false,
    callBackWithDataKey: true,
    disableHeaderFixed: false,
};

CustomTableComponent.propTypes = {
    isFilterable: PropTypes.bool,
    isSortable: PropTypes.bool,
    pageSize: PropTypes.number,
    page: PropTypes.number,
    endPointUrl: PropTypes.string.isRequired,
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
    onDataLoaded: PropTypes.func,
    onDataUpdated: PropTypes.func,
    withBorder: PropTypes.bool,
    isUpdated: PropTypes.bool,
    callBackWithDataKey: PropTypes.bool,
    disableHeaderFixed: PropTypes.bool,
};

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

const CustomTableComponentIntl = injectIntl(CustomTableComponent);

export default connect(null, MapDispatchToProps)(CustomTableComponentIntl);
