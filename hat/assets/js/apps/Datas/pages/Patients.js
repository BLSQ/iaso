import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import LoadingSpinner from '../../../components/loading-spinner';
import ChoosePeriodSelectorComponent from '../../../components/ChoosePeriodSelectorComponent';
import { createUrl } from '../../../utils/fetchData';
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

export const urls = [];

const baseUrl = 'register/list';

class Patients extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: registerListColumns(props.intl.formatMessage),
        };
    }

    componentWillMount() {
        Promise.all([
            this.props.fetchProvinces(),
            this.props.fetchTeams(),
            this.props.fetchCoordinations(),
            this.props.fetchWorkZones(),
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
        const { params } = this.props;

        const newParams = {
            patient_id: patient.id,
            ...params,
        };

        this.props.redirectTo('register/detail', newParams);
    }

    render() {
        const { formatMessage } = this.props.intl;
        const {
            patientsFilters: {
                teams,
                coordinations,
                provinces,
                zones,
                areas,
                villages,
                workzones,
                devices,
            },
            setPatientList,
            params,
            reduxPage,
        } = this.props;
        const filters = filtersPatients2(formatMessage, defineMessages);
        const search = filtersPatientsSearch(devices);
        const geo = filtersPatientsGeo(
            workzones,
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
                    this.props.load.loading && <LoadingSpinner message={formatMessage({
                        defaultMessage: 'Chargement en cours',
                        id: 'microplanning.labels.loading',
                    })}
                    />
                }

                <div className="widget__container ">
                    <div className="widget__header">
                        <h2 className="widget__heading"><FormattedMessage id="datas.register.header.title" defaultMessage="Registre" /></h2>
                    </div>
                    <div className="widget__content--quarter">
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={geo}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={search}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={filters}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={filtersPatientsTreatments(teams || [], formatMessage, defineMessages)}
                            />
                        </div>
                    </div>
                    <ChoosePeriodSelectorComponent
                        params={this.props.params}
                        baseUrl={baseUrl}
                        redirectTo={this.props.redirectTo}
                    />
                </div>
                <div className="widget__container  no-border">
                    <CustomTableComponent
                        isSortable
                        showPagination
                        endPointUrl={this.getEndpointUrl()}
                        columns={this.state.tableColumns}
                        defaultSorted={[{ id: 'last_name', desc: false }]}
                        params={params}
                        defaultPath={baseUrl}
                        dataKey="patient"
                        onRowClicked={patientItem => this.selectPatient(patientItem)}
                        multiSort
                        onDataLoaded={(newPatientList, count, pages) => setPatientList(newPatientList, true, params, count, pages)}
                        reduxPage={reduxPage}
                    />
                    <div className="align-right">
                        <DownloadButtonsComponent
                            csvUrl={this.getEndpointUrl(true, 'csv')}
                            xlsxUrl={this.getEndpointUrl(true, 'xlsx')}
                        />
                    </div>
                </div>
            </section>
        );
    }
}
Patients.defaultProps = {
    reduxPage: undefined,
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
    fetchWorkZones: PropTypes.func.isRequired,
    fetchDevices: PropTypes.func.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectVillage: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    setPatientList: PropTypes.func.isRequired,
    reduxPage: PropTypes.object,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    patientsFilters: state.patientsFilters,
    filters: state.filters,
    reduxPage: state.patients.patientsPage,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchTeams: () => dispatch(filterActions.fetchTeams(dispatch)),
    fetchCoordinations: () => dispatch(filterActions.fetchCoordinations(dispatch)),
    fetchProvinces: () => dispatch(filterActions.fetchProvinces(dispatch)),
    fetchWorkZones: () => dispatch(filterActions.fetchWorkZones(dispatch)),
    fetchDevices: () => dispatch(filterActions.fetchDevices(dispatch)),
    selectProvince: (provinceId, zoneId, areaId, villageId) => dispatch(filterActions.selectProvince(provinceId, dispatch, zoneId, areaId, villageId)),
    selectVillage: villageId => dispatch(filterActions.selectVillage(villageId, dispatch)),
    selectZone: (zoneId, areaId, villageId) => dispatch(filterActions.selectZone(zoneId, dispatch, true, areaId, villageId)),
    selectArea: (areaId, villageId, zoneId) => dispatch(filterActions.selectArea(areaId, dispatch, true, zoneId, villageId)),
    setPatientList: (patientList, showPagination, params, count, pages) => dispatch(patientsActions.setPatientList(patientList, showPagination, params, count, pages)),
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
});

const PatientsWithIntl = injectIntl(Patients);

export default connect(MapStateToProps, MapDispatchToProps)(PatientsWithIntl);
