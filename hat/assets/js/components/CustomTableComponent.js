import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import ReactTable, { ReactTableDefaults } from 'react-table';
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
            data: [],
            pages: null,
            loading: true,
            showPagination: false,
            page: props.params.page ? parseInt(props.params.page, 10) : props.page,
            pageSize: props.params.pageSize ? parseInt(props.params.pageSize, 10) : props.pageSize,
            order: orderArray,
            count: undefined,
        };
        Object.assign(ReactTableDefaults, customTableTranslations(formatMessage));
    }

    componentDidMount() {
        this.onFetchData({
            sorted: this.state.order,
            page: this.state.page,
            pageSize: this.state.pageSize,
        }, this.props.endPointUrl);
    }

    componentWillReceiveProps(newProps) {
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
        this.props.onDataUpdated();
        let orderTemp = '';
        settings.sorted.map((sort, index) => {
            orderTemp += `${index > 0 ? ',' : ''}${getOrderValue(sort)}`;
            return true;
        });
        this.setState({
            loading: true,
        });
        setTimeout(() => { // !!!!!! to FIX !
            getRequest(`${url}&order=${orderTemp}&limit=${settings.pageSize}&page=${settings.page}`, this.props.dispatch).then((data) => {
                const tempdata = this.props.dataKey ? data[this.props.dataKey] : data;
                this.props.onDataLoaded(tempdata);
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
        }, 0);
    }

    onRowClicked(state, rowInfo) {
        return {
            onClick: (e) => {
                e.preventDefault();
                this.props.onRowClicked(rowInfo.original, state);
            },
        };
    }

    render() {
        const currentPageSize = this.state.showPagination || (!this.state.showPagination && this.state.data.length === 0) ? this.state.pageSize : this.state.data.length;
        return (
            <section className={`custom-table-container ${this.props.selectable ? 'selectable' : ''} ${!this.state.showPagination && this.state.count ? 'no-pagination' : ''}`}>
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
};

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

const CustomTableComponentIntl = injectIntl(CustomTableComponent);

export default connect(null, MapDispatchToProps)(CustomTableComponentIntl);
