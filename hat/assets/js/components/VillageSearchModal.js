/*
 * This component displays a modal ti assing As to team.
 */

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import ReactModal from 'react-modal';
import { injectIntl, FormattedMessage } from 'react-intl';
import ReactTable, { ReactTableDefaults } from 'react-table';

import {
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
            orders: 'name',
        };
        Object.assign(ReactTableDefaults, customTableTranslations(formatMessage));
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
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
        this.setState({
            showModal: !this.state.showModal,
        });
    }

    searchVillages(
        searchString = this.state.searchString,
        currentPageSize = this.state.currentPageSize,
        currentPage = this.state.currentPage,
        orders = this.state.orders,
    ) {
        this.setState({
            loading: true,
            searchString,
        });
        const url = `/api/villages/?as_list=true&limit=${currentPageSize}&include_unlocated=true&page=${currentPage}&search=${searchString}&order=${orders}`;
        req
            .get(url)
            .then((res) => {
                const data = res.body;
                this.setState({
                    results: data.villages,
                    currentPage: data.page,
                    currentPageSize: parseInt(data.limit, 10),
                    pages: data.pages,
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
        } = this.props;
        const {
            showModal,
            loading,
            pages,
            currentPageSize,
            currentPage,
            results,
            searchString,
        } = this.state;
        return (
            <Fragment>

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
                <ReactModal
                    isOpen={showModal}
                    shouldCloseOnOverlayClick
                    onRequestClose={() => this.toggleModal()}
                >
                    <section className="extra-large-modal-content village-search-modal">
                        <div className="widget__header">
                            <FormattedMessage id="locator.label.searchAllByVillage" defaultMessage="Text search (by village)" />
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
                                    columns={villageSearchColumns(formatMessage)}
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
};

VillageSearchModal.propTypes = {
    onSelectVillage: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    btnMessage: PropTypes.string,
};


export default injectIntl(VillageSearchModal);
