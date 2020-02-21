/*
 * This component displays a modal ti assing As to team.
 */

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import ReactModal from 'react-modal';
import { injectIntl, FormattedMessage } from 'react-intl';
import ReactTable, { ReactTableDefaults } from 'react-table';

import {
    Typography,
    Grid,
} from '@material-ui/core';

import customTableTranslations from '../utils/constants/customTableTranslations';
import Search from './Search';
import MESSAGES from '../utils/constants/villageSearchMessage';
import villageSearchColumns from '../utils/constants/villageSearchColumns';

const getOrderValue = obj => (!obj.desc ? obj.id : `-${obj.id}`);
const req = require('superagent');

class VillageSearchModal extends Component {
    constructor(props) {
        super(props);
        const { formatMessage } = this.props.intl;
        this.state = {
            searchString: '',
            showModal: false,
            currentPage: 1,
            currentPageSize: 10,
            pages: 0,
            loading: false,
            results: [],
            currentCount: 0,
            orders: 'name',
        };
        Object.assign(ReactTableDefaults, customTableTranslations(formatMessage));
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentDidMount() {
        const {
            autoLoad,
        } = this.props;
        if (autoLoad) {
            this.searchVillages();
        }
    }

    onRowClicked(state, rowInfo) {
        const {
            onSelectVillage,
        } = this.props;
        return {
            onClick: (e) => {
                e.preventDefault();
                onSelectVillage(rowInfo.original);
                this.toggleModal();
            },
            style: {
                cursor: 'pointer',
            },
        };
    }

    onPageSizeChange(currentPageSize) {
        this.setState({
            currentPageSize,
            currentPage: 1,
        });
        const {
            searchString,
        } = this.state;
        this.searchVillages(searchString, currentPageSize, 1);
    }

    onChangeSort(sortList) {
        let orders = '';
        sortList.forEach((sort, index) => {
            orders += `${index > 0 ? ',' : ''}${getOrderValue(sort)}`;
        });

        this.setState({
            orders,
        });
        const {
            searchString,
            currentPageSize,
            currentPage,
        } = this.state;
        this.searchVillages(searchString, currentPageSize, currentPage, orders);
    }

    onPageChange(currentPage) {
        this.setState({
            currentPage,
        });
        const {
            searchString,
            currentPageSize,
        } = this.state;
        this.searchVillages(searchString, currentPageSize, currentPage);
    }


    toggleModal() {
        if (this.props.toggleModal === null) {
            this.setState({
                showModal: !this.state.showModal,
            });
        } else {
            this.props.toggleModal();
        }
    }

    searchVillages(
        searchString = this.state.searchString,
        currentPageSize = this.state.currentPageSize,
        currentPage = this.state.currentPage,
        orders = this.state.orders,
    ) {
        const {
            filters,
        } = this.props;
        this.setState({
            loading: true,
            searchString,
        });
        let url = `/api/villages/?as_list=true&limit=${currentPageSize}&page=${currentPage}&order=${orders}`;
        if (searchString !== '') {
            filters.search = searchString;
        }
        Object.keys(filters).forEach((filterKey) => {
            url += `&${filterKey}=${filters[filterKey]}`;
        });
        req
            .get(url)
            .then((res) => {
                const data = res.body;
                this.setState({
                    results: data.villages,
                    currentPage: data.page,
                    currentPageSize: parseInt(data.limit, 10),
                    pages: data.pages,
                    currentCount: data.count,
                    loading: false,
                });
            })
            .catch((err) => {
                this.setState({
                    loading: false,
                });
                console.error(`Error while fetching Villages: ${err}`);
            });
    }

    resetSearch() {
        this.setState({
            results: [],
            searchString: '',
        });
    }

    render() {
        const {
            intl: {
                formatMessage,
            },
            onSelectVillage,
            btnMessage,
            showButton,
            columns,
            getResutText,
        } = this.props;
        const showModal = this.props.showModal === null ? this.state.showModal : this.props.showModal;
        const {
            loading,
            pages,
            currentPageSize,
            currentPage,
            results,
            searchString,
            currentCount,
        } = this.state;
        return (
            <Fragment>
                {
                    showButton
                    && (
                        <button
                            className="button--tiny margin-right"
                            onClick={() => this.toggleModal()}
                        >
                            {
                                btnMessage === ''
                                && <FormattedMessage id="main.label.searchVillage" defaultMessage="Search a village" />
                            }
                            {
                                btnMessage !== ''
                                && btnMessage
                            }
                        </button>
                    )
                }
                <ReactModal
                    isOpen={showModal}
                    shouldCloseOnOverlayClick
                    onRequestClose={() => this.toggleModal()}
                >
                    <section className="extra-large-modal-content village-search-modal">
                        <div className="widget__header">

                            <Grid container spacing={2}>
                                <Grid
                                    xs={6}
                                    item
                                    container
                                >
                                    <FormattedMessage id="locator.label.searchAllByVillage" defaultMessage="Text search (by village)" />
                                </Grid>
                                <Grid
                                    xs={6}
                                    item
                                    container
                                    justify="flex-end"
                                >
                                    {
                                        currentCount > 0
                                        && (
                                            <Typography
                                                type="body2"
                                                color="primary"
                                            >
                                                {
                                                    getResutText(currentCount)
                                                    || (
                                                        <Fragment>
                                                            {currentCount}
                                                            {' '}
                                                            <FormattedMessage id="main.label.villages" defaultMessage="main.label.villages" />
                                                        </Fragment>
                                                    )
                                                }
                                            </Typography>
                                        )
                                    }
                                </Grid>
                            </Grid>
                        </div>

                        <Grid container spacing={2}>
                            <Grid
                                xs={6}
                                md={3}
                                item
                                container
                            >
                                <Search
                                    searchString={searchString}
                                    placeholderText={formatMessage(MESSAGES.searchPlaceholder)}
                                    noEnoughText={formatMessage(MESSAGES.searchMinChar)}
                                    minCharCount={1}
                                    onSearch={value => this.searchVillages(value)}
                                    resetSearch={() => this.resetSearch()}
                                    onSortedChange={sort => this.onChangeSort(sort)}
                                    isLoading={loading}
                                    disableBlurSearch
                                    displayResults={false}
                                    resetOnUnmount={false}
                                    showResetSearch
                                />
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid
                                xs={12}
                                item
                                container
                            >
                                <ReactTable
                                    showPagination
                                    manual
                                    multiSort
                                    columns={columns || villageSearchColumns(formatMessage)}
                                    data={results}
                                    pages={pages}
                                    loading={loading}
                                    onPageChange={page => this.onPageChange(page + 1)}
                                    onPageSizeChange={pageSize => this.onPageSizeChange(pageSize)}
                                    onSortedChange={sort => this.onChangeSort(sort)}
                                    filterable={false}
                                    sortable
                                    pageSize={currentPageSize}
                                    page={currentPage - 1}
                                    className="-striped -highlight"
                                    defaultSorted={[{ id: 'name', desc: false }]}
                                    pageSizeOptions={[5, 10, 20, 25, 50, 100, 150, 200]}
                                    onSelect={village => onSelectVillage(village.id)}
                                    getTdProps={(state, rowInfo) => this.onRowClicked(state, rowInfo)}
                                    style={{
                                        height: '60vh',
                                    }}
                                />
                            </Grid>
                        </Grid>
                        <Grid container spacing={2}>
                            <Grid
                                xs={12}
                                item
                                container
                                justify="flex-end"
                            >

                                <button
                                    className="button margin-top"
                                    onClick={() => this.toggleModal()}
                                >
                                    <FormattedMessage id="main.label.close" defaultMessage="Fermer" />
                                </button>

                                <button
                                    className="button margin-top margin-left"
                                    onClick={() => this.searchVillages()}
                                >
                                    <FormattedMessage id="main.label.search" defaultMessage="Rechercher" />
                                </button>
                            </Grid>
                        </Grid>
                    </section>
                </ReactModal>
            </Fragment>
        );
    }
}
VillageSearchModal.defaultProps = {
    btnMessage: '',
    showButton: true,
    toggleModal: null,
    showModal: null,
    columns: null,
    filters: {},
    autoLoad: false,
    getResutText: null,
};

VillageSearchModal.propTypes = {
    onSelectVillage: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    btnMessage: PropTypes.string,
    showButton: PropTypes.bool,
    showModal: PropTypes.any,
    toggleModal: PropTypes.any,
    columns: PropTypes.any,
    filters: PropTypes.object,
    autoLoad: PropTypes.bool,
    getResutText: PropTypes.any,
};


export default injectIntl(VillageSearchModal);
