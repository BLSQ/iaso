/*
 * This component displays a modal ti assing As to team.
 */

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import ReactModal from 'react-modal';
import { injectIntl, FormattedMessage } from 'react-intl';
import ReactTable, { ReactTableDefaults } from 'react-table';
import isEqual from 'lodash/isEqual';

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
            currentPageSize: props.defaultPageSize,
            pages: 0,
            loading: false,
            results: [],
            currentCount: 0,
            orders: 'name',
            sortList: [],
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

    componentDidUpdate(prevProps) {
        const {
            onSearch,
            results,
        } = this.props;
        if (onSearch && !isEqual(prevProps.results, results)) {
            this.setResults(results);
        }
    }

    onRowClicked(state, rowInfo) {
        const {
            onSelectVillage,
        } = this.props;
        return {
            onClick: (e) => {
                e.preventDefault();
                if (onSelectVillage) {
                    onSelectVillage(rowInfo.original);
                    this.toggleModal();
                }
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
        const {
            onSearch,
        } = this.props;
        if (!onSearch) {
            this.searchVillages(searchString, currentPageSize, 1);
        }
    }

    onChangeSort(sortList) {
        let orders = '';
        sortList.forEach((sort, index) => {
            orders += `${index > 0 ? ',' : ''}${getOrderValue(sort)}`;
        });

        this.setState({
            orders,
            sortList,
        });

        const {
            onSearch,
        } = this.props;
        if (!onSearch) {
            const {
                searchString,
                currentPageSize,
                currentPage,
            } = this.state;
            this.searchVillages(searchString, currentPageSize, currentPage, orders);
        }
    }

    onPageChange(currentPage) {
        this.setState({
            currentPage,
        });
        const {
            searchString,
            currentPageSize,
        } = this.state;
        const {
            onSearch,
        } = this.props;
        if (!onSearch) {
            this.searchVillages(searchString, currentPageSize, 1);
        }
    }

    setResults(results) {
        this.setState({
            results,
            loading: false,
            currentCount: results.length,
        });
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
            onSearch,
        } = this.props;
        this.setState({
            loading: true,
            searchString,
        });
        if (onSearch) {
            onSearch(searchString, currentPageSize, currentPage, orders);
        } else {
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
    }

    changeSearch(searchString) {
        this.setState({
            searchString,
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
            extraButtons,
            btnMessage,
            showButton,
            columns,
            getResutText,
            onSearch,
            defaultSortKey,
            defaultPageSize,
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
            sortList,
        } = this.state;
        let extraProps = {
            page: currentPage - 1,
            onPageChange: page => this.onPageChange(page + 1),
            onPageSizeChange: pageSize => this.onPageSizeChange(pageSize),
            onSortedChange: sort => this.onChangeSort(sort),
        };
        if (!onSearch) {
            extraProps = {
                ...extraProps,
                pageSize: currentPageSize,
                pages,
                loading,
            };
        }
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
                                    minCharCount={-1}
                                    onChange={value => this.changeSearch(value)}
                                    onSearch={value => this.searchVillages(value)}
                                    resetSearch={() => this.resetSearch()}
                                    isLoading={loading}
                                    disableBlurSearch
                                    displayResults={false}
                                    resetOnUnmount={false}
                                    showResetSearch
                                    allowEmptySearch
                                />
                            </Grid>
                            <Grid
                                xs={6}
                                md={9}
                                item
                                container
                                justify="flex-end"
                                alignItems="baseline"
                            >
                                <button
                                    className="button"
                                    onClick={() => this.searchVillages()}
                                >
                                    <i className="fa fa-search" />
                                    <FormattedMessage id="main.label.search" defaultMessage="Rechercher" />
                                </button>
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
                                    multiSort
                                    columns={columns || villageSearchColumns(formatMessage)}
                                    data={results}
                                    filterable={false}
                                    sortable
                                    className="-striped -highlight"
                                    defaultSorted={sortList.length > 0 ? sortList : [{ id: defaultSortKey || 'name', desc: false }]}
                                    pageSizeOptions={[5, 10, 20, 25, 50, 100, 150, 200]}
                                    getTdProps={(state, rowInfo) => this.onRowClicked(state, rowInfo)}
                                    style={{
                                        height: '60vh',
                                    }}
                                    defaultPageSize={Boolean(onSearch) && defaultPageSize !== currentPageSize ? currentPageSize : defaultPageSize}
                                    {...extraProps}
                                />
                            </Grid>
                        </Grid>
                        <section className="margin-top">

                            <Grid container spacing={2}>
                                <Grid
                                    xs={extraButtons.length > 0 ? 6 : 12}
                                    item
                                    container
                                    justify={extraButtons.length > 0 ? 'flex-start' : 'flex-end'}
                                >

                                    <button
                                        className="button"
                                        onClick={() => this.toggleModal()}
                                    >
                                        <FormattedMessage id="main.label.close" defaultMessage="Fermer" />
                                    </button>
                                </Grid>
                                {
                                    extraButtons.length > 0
                                    && (
                                        <Grid
                                            xs={6}
                                            item
                                            container
                                            justify="flex-end"
                                        >
                                            {
                                                extraButtons.map((b, i) => <span key={i}>{b}</span>)
                                            }
                                        </Grid>
                                    )
                                }
                            </Grid>
                        </section>
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
    onSelectVillage: null,
    extraButtons: [],
    onSearch: null,
    results: [],
    defaultSortKey: null,
    defaultPageSize: 10,
};

VillageSearchModal.propTypes = {
    onSelectVillage: PropTypes.any,
    intl: PropTypes.object.isRequired,
    btnMessage: PropTypes.string,
    showButton: PropTypes.bool,
    showModal: PropTypes.any,
    toggleModal: PropTypes.any,
    columns: PropTypes.any,
    filters: PropTypes.object,
    autoLoad: PropTypes.bool,
    getResutText: PropTypes.any,
    extraButtons: PropTypes.array,
    onSearch: PropTypes.func,
    results: PropTypes.array,
    defaultSortKey: PropTypes.any,
    defaultPageSize: PropTypes.number,
};


export default injectIntl(VillageSearchModal);
