import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import ReactTable, { ReactTableDefaults } from 'react-table';
import { getRequest, createUrl } from '../utils/fetchData';

const getOrderValue = obj => {
    return !obj.desc ? obj.id : `-${obj.id}`;
};


const getOrderObject = stringValue => {
    return [{
        id : stringValue.replace('-', ''),
        desc : stringValue.indexOf('-') !== -1
    }];
};

class CustomTableComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            data: [],
            pages: null,
            loading: true,
            showPagination: false,
            columns: null,
            order: props.params.order ? getOrderObject(props.params.order) : props.defaultSorted,
        };

        const { formatMessage } = this.props.intl;
        Object.assign(ReactTableDefaults, {
            previousText: formatMessage({
                defaultMessage: 'Précédent',
                id: 'table.previous',
            }),
            nextText: formatMessage({
                defaultMessage: 'Suivant',
                id: 'table.next',
            }),
            loadingText: formatMessage({
                defaultMessage: 'Chargement...',
                id: 'table.loading',
            }),
            noDataText: formatMessage({
                defaultMessage: 'Aucun résultat',
                id: 'table.noResult',
            }),
            pageText: formatMessage({
                defaultMessage: 'Page',
                id: 'table.page',
            }),
            ofText: formatMessage({
                defaultMessage: 'de',
                id: 'table.of',
            }),
            rowsText: formatMessage({
                defaultMessage: 'résultats',
                id: 'table.results',
            }),
        });
    }

    componentWillReceiveProps(newProps) {
        if (newProps.endPointUrl !== this.props.endPointUrl) {
            this.onFetchData({
                sorted: newProps.params.order ? getOrderObject(newProps.params.order) : this.props.defaultSorted,
            }, newProps.endPointUrl);
        }
    }

    onChangeSort(sort) {
        const orderTemp = getOrderValue(sort[0]);
        if (orderTemp !== this.props.params.order) {
            this.props.redirectTo(this.props.defaultPath, {
                ...this.props.params,
                order: orderTemp
            })
        }
    }

    onFetchData(settings, url = this.props.endPointUrl) {
        const orderTemp = getOrderValue(settings.sorted[0]);
        this.setState({
            loading: true,
        });
        getRequest(`${url}&order=${orderTemp}`, this.props.dispatch).then((data) => {
            data.pages = 1;
            setTimeout(() => {
                this.setState({
                    data,
                    pages: data.pages,
                    loading: false,
                    showPagination: (data.pages > 1) && this.props.showPagination,
                });
            }, 100)
        })
    }

    onRowClicked(state, rowInfo) {
        return {
            onClick: (e) => {
                e.preventDefault();
                this.props.onRowClicked(rowInfo.original, state);
            }
        };
    }

    render() {
        return (
            <ReactTable
                manual
                multiSort={false}
                columns={this.props.columns}
                data={this.state.data}
                pages={this.state.pages}
                loading={this.state.loading}
                onSortedChange={sort => this.onChangeSort(sort)}
                onFetchData={settings => this.onFetchData(settings)}
                filterable={this.props.isFilterable}
                sortable={this.props.isSortable}
                defaultPageSize={
                    this.state.data.length > this.props.pageSize ?
                    this.props.pageSize :
                    this.state.data.length
                }
                className="-striped -highlight"
                getTdProps={(state, rowInfo) => this.onRowClicked(state, rowInfo)}
                showPagination={this.state.showPagination}
                defaultSorted={this.state.order}
            />
        );
    }
}
CustomTableComponent.defaultProps = {
    isFilterable: false,
    isSortable: false,
    pageSize: 10,
    onRowClicked: () => { },
    showPagination: false,
    defaultSorted: [],
    defaultPath: '',
};

CustomTableComponent.propTypes = {
    isFilterable: PropTypes.bool,
    isSortable: PropTypes.bool,
    pageSize: PropTypes.number,
    endPointUrl: PropTypes.string.isRequired,
    columns: PropTypes.arrayOf(PropTypes.object).isRequired,
    params: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    onRowClicked: PropTypes.func,
    showPagination: PropTypes.bool,
    defaultSorted: PropTypes.arrayOf(PropTypes.object),
    defaultPath: PropTypes.string,
};

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

const CustomTableComponentIntl = injectIntl(CustomTableComponent);

export default connect(null, MapDispatchToProps)(CustomTableComponentIntl);