import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import LoadingSpinner from '../../../components/loading-spinner';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import { createUrl } from '../../../utils/fetchData';
import { filterActions } from '../../../redux/filtersRedux';

import CustomTableComponent from '../../../components/CustomTableComponent';
import FiltersComponent from '../../../components/FiltersComponent';
import DownloadButtonsComponent from '../../../components/DownloadButtonsComponent';
import SearchButton from '../../../components/SearchButton';
import DeleteCaseModalComponent from '../components/DeleteCaseModalComponent';

import {
    filtersCases, filtersCases2, filtersCasesSearch, filtersCasesGeo,
} from '../constants/filtersSelect';

import { casesActions } from '../redux/cases';

import { currentUserActions } from '../../../redux/currentUserReducer';


import { anonymous } from '../../../utils/constants/filters';
import casesListColumns from '../constants/casesListColumns';

import { userHasPermission } from '../../../utils';

export const urls = [];

class Cases extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: [],
            tableUrl: null,
            canEditPatientInfos: false,
            canDeleteForever: false,
            showDeleteModale: false,
            caseDeleted: null,
        };
    }

    componentWillMount() {
        if (this.props.params.back) {
            this.onSearch();
            const { params } = this.props;
            delete params.back;
            this.props.redirectTo('tests', params);
        }
        Promise.all([
            this.props.fetchProvinces(),
            this.props.fetchTeams(),
            this.props.fetchCoordinations(),
            this.props.fetchDevices(),
            this.props.fetchCurrentUserInfos(),
        ]).then(() => {
            if (this.props.params.province_id) {
                this.props.selectProvince(this.props.params.province_id, this.props.params.zs_id, this.props.params.as_id, this.props.params.village_id);
            } else if (this.props.params.zs_id) {
                this.props.selectZone(this.props.params.zs_id, this.props.params.as_id, this.props.params.village_id);
            } else if (this.props.params.as_id) {
                this.props.selectArea(this.props.params.as_id, this.props.params.village_id, this.props.params.zs_id);
            } else if (this.props.params.village_id) {
                this.props.selectVillage(this.props.params.village_id);
            }
        });
    }

    componentWillReceiveProps(newProps) {
        const {
            currentUser,
            permissions,
            intl: {
                formatMessage,
            },
        } = this.props;
        if (currentUser.id) {
            const canEditPatientInfos = userHasPermission(permissions, currentUser, 'x_datas_patient_edition') || currentUser.is_superuser;
            const canDeleteForever = userHasPermission(permissions, currentUser, 'x_management_users') || currentUser.is_superuser;
            this.setState({
                tableColumns: casesListColumns(formatMessage, canEditPatientInfos, canDeleteForever, this),
                canEditPatientInfos,
                canDeleteForever,
            });
        }
        if (newProps.params.province_id !== this.props.params.province_id) {
            this.props.selectProvince(newProps.params.province_id, newProps.params.zs_id, newProps.params.as_id, newProps.params.village_id);
        } else if (newProps.params.zs_id !== this.props.params.zs_id) {
            this.props.selectZone(newProps.params.zs_id, newProps.params.as_id, newProps.params.village_id);
        } else if (newProps.params.as_id !== this.props.params.as_id) {
            this.props.selectArea(newProps.params.as_id, newProps.params.village_id, newProps.params.zs_id);
        } else if (newProps.params.village_id !== this.props.params.village_id) {
            this.props.selectVillage(newProps.params.village_id);
        }
    }

    onSearch() {
        this.setState({
            tableUrl: this.getEndpointUrl(),
        });
    }

    onSelectCase(caseItem) {
        const { params } = this.props;

        const newParams = {
            patient_id: caseItem.patient.id,
            case_id: caseItem.id,
            ...params,
            tab: 'tests',
        };

        this.props.redirectTo('tests/detail', newParams);
    }

    onDeleteCase(caseItem, fullDelete) {
        const {
            deleteCase,
            params,
        } = this.props;
        let url = this.getEndpointUrl();
        url += `&order=${params.order}`;
        url += `&limit=${params.pageSize}`;
        url += `&page=${params.page}`;
        deleteCase(caseItem.id, url, fullDelete);
    }

    getEndpointUrl(toExport = false, exportType = 'csv') {
        let url = '/api/cases/?';
        const {
            params,
        } = this.props;

        const urlParams = {
            ...params,
            located: params.located ? params.located : 'all',
            from: params.date_from,
            to: params.date_to,
        };
        if (urlParams.workzone_id) {
            delete urlParams.workzone_id;
        }

        if (toExport) {
            urlParams[exportType] = true;
            urlParams.anonymous = params.anonymous;
        }
        if (urlParams.order) {
            delete urlParams.order;
        }

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value && !url.includes(key)) {
                url += `&${key}=${value}`;
            }
        });
        return url;
    }

    toggleDeleteModale(caseDeleted) {
        this.setState({
            showDeleteModale: Boolean(caseDeleted),
            caseDeleted,
        });
    }

    render() {
        const { formatMessage } = this.props.intl;
        const {
            filters: {
                teams,
                coordinations,
                provinces,
                zones,
                areas,
                villages,
                devices,
            },
            reduxPage,
            params,
            setCasesList,
        } = this.props;
        const {
            canEditPatientInfos,
            canDeleteForever,
            showDeleteModale,
            caseDeleted,
        } = this.state;
        const filters1 = filtersCases(formatMessage, devices);
        const filters2 = filtersCases2(
            formatMessage,
            coordinations || [],
            teams || [],
            canEditPatientInfos || canDeleteForever,
        );
        const search = filtersCasesSearch(formatMessage, this);
        const geo = filtersCasesGeo(
            provinces || [],
            zones || [],
            areas || [],
            villages || [],
            this.props,
            'tests',
        );
        return (
            <section className="cases-list-container">
                {
                    this.props.load.loading && (
                        <LoadingSpinner message={formatMessage({
                            defaultMessage: 'Loading',
                            id: 'main.label.loading',
                        })}
                        />
                    )
                }
                {
                    showDeleteModale
                    && (
                        <DeleteCaseModalComponent
                            showModale={showDeleteModale}
                            toggleModal={() => this.toggleDeleteModale()}
                            caseItem={caseDeleted}
                            onDeleteCase={caseItem => this.onDeleteCase(caseItem, true)}
                        />
                    )
                }

                <div className="widget__container ">
                    <div className="widget__header">
                        <h2 className="widget__heading"><FormattedMessage id="datas.tests.header.title" defaultMessage="Tests" /></h2>
                    </div>
                    <div className="widget__header widget__content--quarter">
                        <PeriodSelectorComponent
                            dateFrom={this.props.params.date_from}
                            dateTo={this.props.params.date_to}
                            onChangeDate={(dateFrom, dateTo) => this.props.redirectTo('tests', {
                                ...this.props.params,
                                date_from: dateFrom,
                                date_to: dateTo,
                            })}
                        />
                    </div>
                    <div className="widget__content--quarter">
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl="tests"
                                filters={geo}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl="tests"
                                filters={search}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl="tests"
                                filters={filters1}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl="tests"
                                filters={filters2}
                            />
                        </div>
                    </div>
                    <SearchButton onSearch={() => this.onSearch()} />
                </div>
                {
                    this.state.tableUrl
                    && (
                        <div className="widget__container  no-border">
                            <CustomTableComponent
                                isSortable
                                showPagination
                                endPointUrl={this.state.tableUrl}
                                columns={this.state.tableColumns}
                                defaultSorted={[{ id: 'latest_test_date', desc: true }]}
                                params={this.props.params}
                                canSelect={false}
                                defaultPath="tests"
                                dataKey="cases"
                                multiSort
                                caseItem={false}
                                onDataLoaded={(newCasesList, count, pages) => setCasesList(newCasesList, true, params, count, pages)}
                                reduxPage={reduxPage}
                            />
                            <div className="align-right">
                                <div className="display-inline-block">
                                    <FiltersComponent
                                        params={this.props.params}
                                        baseUrl="tests"
                                        filters={[anonymous()]}
                                    />
                                </div>
                                <DownloadButtonsComponent
                                    csvUrl={this.getEndpointUrl(true, 'csv')}
                                    xlsxUrl={this.getEndpointUrl(true, 'xlsx')}
                                />
                            </div>
                        </div>
                    )
                }
            </section>
        );
    }
}
Cases.defaultProps = {
    reduxPage: undefined,
};

Cases.propTypes = {
    load: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    filters: PropTypes.object.isRequired,
    fetchProvinces: PropTypes.func.isRequired,
    fetchTeams: PropTypes.func.isRequired,
    fetchCoordinations: PropTypes.func.isRequired,
    fetchDevices: PropTypes.func.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectVillage: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    reduxPage: PropTypes.object,
    setCasesList: PropTypes.func.isRequired,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
    currentUser: PropTypes.object.isRequired,
    permissions: PropTypes.array.isRequired,
    deleteCase: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    filters: state.testsFilters,
    reduxPage: state.cases.casesPage,
    currentUser: state.currentUser.user,
    permissions: state.currentUser.permissions,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchTeams: () => dispatch(filterActions.fetchTeams(dispatch)),
    fetchCoordinations: () => dispatch(filterActions.fetchCoordinations(dispatch)),
    fetchProvinces: () => dispatch(filterActions.fetchProvinces(dispatch)),
    fetchDevices: () => dispatch(filterActions.fetchDevices(dispatch)),
    selectProvince: (provinceId, zoneId, areaId, villageId) => dispatch(filterActions.selectProvince(provinceId, dispatch, zoneId, areaId, villageId)),
    selectVillage: villageId => dispatch(filterActions.selectVillage(villageId, dispatch)),
    selectZone: (zoneId, areaId, villageId) => dispatch(filterActions.selectZone(zoneId, dispatch, true, areaId, villageId)),
    selectArea: (areaId, villageId, zoneId) => dispatch(filterActions.selectArea(areaId, dispatch, true, zoneId, villageId)),
    setCasesList: (patientList, showPagination, params, count, pages) => dispatch(casesActions.setCasesList(patientList, showPagination, params, count, pages)),
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
    deleteCase: (caseId, url, fullDelete) => dispatch(casesActions.deleteCase(dispatch, caseId, url, fullDelete)),
});

const CasesWithIntl = injectIntl(Cases);

export default connect(MapStateToProps, MapDispatchToProps)(CasesWithIntl);
