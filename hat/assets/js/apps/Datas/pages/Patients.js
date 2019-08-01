import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import LoadingSpinner from '../../../components/loading-spinner';
import ChoosePeriodSelectorComponent from '../../../components/ChoosePeriodSelectorComponent';
import { createUrl } from '../../../utils/fetchData';
import { userHasPermission } from '../../../utils';
import { filterActions } from '../../../redux/filtersRedux';


import registerListColumns from '../constants/registerListColumns';
import CustomTableComponent from '../../../components/CustomTableComponent';

import FiltersComponent from '../../../components/FiltersComponent';
import {
    filtersPatients2,
    filtersPatientsSearch,
    filtersPatientsGeo,
    filtersPatientsTreatments,
} from '../constants/filtersSelect';
import { patientsActions } from '../redux/patients';
import DownloadButtonsComponent from '../../../components/DownloadButtonsComponent';
import { currentUserActions } from '../../../redux/currentUserReducer';
import SearchButton from '../../../components/SearchButton';
import { anonymous } from '../../../utils/constants/filters';

import ManualDuplicate from '../components/ManualDuplicate';

export const urls = [];

const baseUrl = 'register/list';

class Patients extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: [],
            tableUrl: null,
        };
    }

    componentWillMount() {
        const {
            params,
            redirectTo,
            fetchProvinces,
            fetchTeams,
            fetchCoordinations,
            fetchDevices,
            fetchCurrentUserInfos,
            selectProvince,
            selectZone,
            selectArea,
            selectVillage,
            emptyManualDuplicate,
        } = this.props;
        if (params.back) {
            delete params.back;
            this.onSearch();
            redirectTo(baseUrl, params);
        }
        if (params.merged) {
            delete params.merged;
            emptyManualDuplicate();
            this.forcePatientsReload();
            redirectTo(baseUrl, params);
        }
        Promise.all([
            fetchProvinces(),
            fetchTeams(),
            fetchCoordinations(),
            fetchDevices(),
            fetchCurrentUserInfos(),
        ]).then(() => {
            if (params.province_id) {
                selectProvince(params.province_id, params.zs_id, params.as_id, params.village_id);
            } else if (params.zs_id) {
                selectZone(params.zs_id, params.as_id, params.village_id);
            } else if (params.as_id) {
                selectArea(params.as_id, params.village_id, params.zs_id);
            } else if (params.village_id) {
                selectVillage(params.village_id);
            }
        });
    }

    componentWillReceiveProps(newProps) {
        const {
            params,
            selectProvince,
            selectZone,
            selectArea,
            selectVillage,
        } = this.props;
        if (newProps.params.province_id !== params.province_id) {
            selectProvince(newProps.params.province_id, newProps.params.zs_id, newProps.params.as_id, newProps.params.village_id);
        } else if (newProps.params.zs_id !== params.zs_id) {
            selectZone(newProps.params.zs_id, newProps.params.as_id, newProps.params.village_id);
        } else if (newProps.params.as_id !== params.as_id) {
            selectArea(newProps.params.as_id, newProps.params.village_id, newProps.params.zs_id);
        } else if (newProps.params.village_id !== params.village_id) {
            selectVillage(newProps.params.village_id);
        }
        if (Boolean(newProps.currentUser.id) && !this.props.currentUser.id) {
            const {
                currentUser,
                permissions,
            } = newProps;
            this.setState({
                tableColumns: registerListColumns(newProps.intl.formatMessage, this, userHasPermission(permissions, currentUser, 'x_duplicates')),
            });
        }
    }

    onSearch() {
        this.setState({
            tableUrl: this.getEndpointUrl(),
        });
    }

    getEndpointUrl(toExport, exportType = 'csv') {
        let url = '/api/patients/?';
        const {
            params,
        } = this.props;
        const urlParams = {
            ...params,
            from: params.date_from,
            to: params.date_to,
        };
        if (urlParams.workzone_id) {
            delete urlParams.workzone_id;
        }

        if (urlParams.order) {
            delete urlParams.order;
        }

        if (urlParams.patient_id) {
            delete urlParams.patient_id;
        }

        if (toExport) {
            urlParams[exportType] = true;
            urlParams.anonymous = params.anonymous;
        }

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value && !url.includes(key)) {
                url += `&${key}=${value}`;
            }
        });
        return url;
    }

    selectPatient(patient) {
        const { params, redirectTo } = this.props;

        const newParams = {
            patient_id: patient.id,
            ...params,
        };

        redirectTo('register/detail', newParams);
    }

    toggleManualDuplicate(patient) {
        const { patientA, patientB, loadManualDuplicate } = this.props;
        const manualDuplicate = {
            patientA,
            patientB,
        };
        if (manualDuplicate.patientA && manualDuplicate.patientA.id === patient.id) {
            manualDuplicate.patientA = null;
        } else if (manualDuplicate.patientB && manualDuplicate.patientB.id === patient.id) {
            manualDuplicate.patientB = null;
        } else if (!manualDuplicate.patientA) {
            manualDuplicate.patientA = patient;
        } else if (!manualDuplicate.patientB) {
            manualDuplicate.patientB = patient;
        }
        loadManualDuplicate(manualDuplicate);
    }

    forcePatientsReload() {
        const {
            params, fetchPatients,
        } = this.props;
        const url = `${this.getEndpointUrl()}&order=${params.order}&limit=${params.pageSize}&page=${params.page}`;
        fetchPatients(url, params);
    }

    render() {
        const {
            intl: { formatMessage },
            load,
            patientsFilters: {
                teams,
                coordinations,
                provinces,
                zones,
                areas,
                villages,
                devices,
            },
            setPatientList,
            params,
            reduxPage,
            redirectTo,
            currentUser,
            permissions,
        } = this.props;
        const { tableUrl, tableColumns } = this.state;
        const filters = filtersPatients2(formatMessage);
        const search = filtersPatientsSearch(devices, this);
        const geo = filtersPatientsGeo(
            provinces || [],
            zones || [],
            areas || [],
            villages || [],
            this.props,
            baseUrl,
            coordinations || [],
        );
        return (
            <section className="cases-list-container">
                {
                    load.loading && (
                        <LoadingSpinner message={formatMessage({
                            defaultMessage: 'Chargement en cours',
                            id: 'microplanning.labels.loading',
                        })}
                        />
                    )
                }

                <div className="widget__container ">
                    <div className="widget__header">
                        <h2 className="widget__heading"><FormattedMessage id="datas.register.header.title" defaultMessage="Registre" /></h2>
                    </div>
                    <div className="border-bottom">
                        <ChoosePeriodSelectorComponent
                            params={params}
                            baseUrl={baseUrl}
                            redirectTo={redirectTo}
                            showApplybutton={false}
                        />
                    </div>
                    <div className="widget__content--quarter">
                        <div>
                            <FiltersComponent
                                params={params}
                                baseUrl={baseUrl}
                                filters={geo}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={params}
                                baseUrl={baseUrl}
                                filters={search}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={params}
                                baseUrl={baseUrl}
                                filters={filters}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={params}
                                baseUrl={baseUrl}
                                filters={filtersPatientsTreatments(teams || [], formatMessage, defineMessages)}
                            />
                        </div>
                    </div>
                    <SearchButton onSearch={() => this.onSearch()} />
                </div>
                {
                    reduxPage.list && userHasPermission(permissions, currentUser, 'x_duplicates') &&
                    <ManualDuplicate
                        toggleManualDuplicate={patient => this.toggleManualDuplicate(patient)}
                        params={params}
                    />
                }
                {
                    tableUrl
                    && (
                        <div className="widget__container  no-border">
                            <CustomTableComponent
                                isSortable
                                showPagination
                                endPointUrl={tableUrl}
                                columns={tableColumns}
                                defaultSorted={[{ id: 'last_name', desc: false }]}
                                params={params}
                                defaultPath={baseUrl}
                                dataKey="patient"
                                multiSort
                                canSelect={false}
                                onDataLoaded={(newPatientList, count, pages) => setPatientList(newPatientList, true, params, count, pages)}
                                reduxPage={reduxPage}
                            />
                            <div className="align-right">
                                <div className="display-inline-block">
                                    <FiltersComponent
                                        params={params}
                                        baseUrl={baseUrl}
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
Patients.defaultProps = {
    reduxPage: undefined,
    patientA: null,
    patientB: null,
};

Patients.propTypes = {
    load: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    patientsFilters: PropTypes.object.isRequired,
    fetchProvinces: PropTypes.func.isRequired,
    fetchTeams: PropTypes.func.isRequired,
    fetchCoordinations: PropTypes.func.isRequired,
    fetchDevices: PropTypes.func.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectVillage: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    setPatientList: PropTypes.func.isRequired,
    reduxPage: PropTypes.object,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
    loadManualDuplicate: PropTypes.func.isRequired,
    patientA: PropTypes.object,
    patientB: PropTypes.object,
    fetchPatients: PropTypes.func.isRequired,
    emptyManualDuplicate: PropTypes.func.isRequired,
    currentUser: PropTypes.object.isRequired,
    permissions: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    patientsFilters: state.patientsFilters,
    filters: state.filters,
    reduxPage: state.patients.patientsPage,
    patientA: state.patients.manualDuplicate.patientA,
    patientB: state.patients.manualDuplicate.patientB,
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
    setPatientList: (patientList, showPagination, params, count, pages) => dispatch(patientsActions.setPatientList(patientList, showPagination, params, count, pages)),
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
    fetchPatients: (url, params) => dispatch(patientsActions.fetchPatients(dispatch, url, params)),
    loadManualDuplicate: manualDuplicate => dispatch(patientsActions.loadManualDuplicate(manualDuplicate)),
    emptyManualDuplicate: () => dispatch(patientsActions.emptyManualDuplicate()),
});

const PatientsWithIntl = injectIntl(Patients);

export default connect(MapStateToProps, MapDispatchToProps)(PatientsWithIntl);
