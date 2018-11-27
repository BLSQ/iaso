import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import LoadingSpinner from '../../../components/loading-spinner';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import { createUrl } from '../../../utils/fetchData';
import { filterActions } from '../../../redux/filtersRedux';

import registerListColumns from '../constants/registerListColumns';
import CustomTableComponent from '../../../components/CustomTableComponent';

import FiltersComponent from '../../../components/FiltersComponent';
import { filtersPatients, filtersPatients2, filtersPatientsSearch, filtersPatientsGeo } from '../constants/filtersSelect';
import { patientsActions } from '../redux/patients';

export const urls = [];

class PatientsDuplicates extends Component {
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

    getEndpointUrl(forCsv) {
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

        if (forCsv) {
            urlParams.csv = true;
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
            },
            setPatientList,
            patientList,
            params,
            reduxParams,
            reduxCount,
            reduxPages,
        } = this.props;
        const filters1 = filtersPatients(formatMessage, defineMessages);
        const filters2 = filtersPatients2(formatMessage, defineMessages, coordinations || [], teams || [], this.props.params.located === 'only_not_located');
        const search = filtersPatientsSearch();
        const geo = filtersPatientsGeo(
            workzones,
            provinces || [],
            zones || [],
            areas || [],
            villages || [],
            this.props,
            'register/list',
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
                    <div className="widget__header widget__content--quarter">
                        <PeriodSelectorComponent
                            dateFrom={this.props.params.date_from}
                            dateTo={this.props.params.date_to}
                            onChangeDate={(dateFrom, dateTo) =>
                                this.props.redirectTo('register/list', {
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
                                baseUrl="register/list"
                                filters={geo}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl="register/list"
                                filters={search}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl="register/list"
                                filters={filters2}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl="register/list"
                                filters={filters1}
                            />
                        </div>
                    </div>
                </div>
                <div className="widget__container  no-border">
                    <CustomTableComponent
                        isSortable
                        showPagination
                        endPointUrl={this.getEndpointUrl()}
                        columns={this.state.tableColumns}
                        defaultSorted={[{ id: 'last_name', desc: false }]}
                        params={params}
                        defaultPath="register/list"
                        dataKey="patient"
                        onRowClicked={patientItem => this.selectPatient(patientItem)}
                        multiSort
                        onDataLoaded={(newPatientList, count, pages) => setPatientList(newPatientList, true, params, count, pages)}
                        reduxDatas={patientList}
                        reduxParams={reduxParams}
                        reduxShowPagination
                        reduxCount={reduxCount}
                        reduxPages={reduxPages}
                    />
                    <div className="align-right">
                        <button
                            className="button--save margin"
                            onClick={() => {
                                window.location.href = this.getEndpointUrl(true);
                            }}
                        >
                            <i className="fa fa-download" />
                            <FormattedMessage id="cases.label.download" defaultMessage="Télécharger" />
                        </button>
                    </div>
                </div>
            </section>
        );
    }
}

PatientsDuplicates.propTypes = {
    load: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    patientsFilters: PropTypes.object.isRequired,
    fetchProvinces: PropTypes.func.isRequired,
    fetchTeams: PropTypes.func.isRequired,
    fetchCoordinations: PropTypes.func.isRequired,
    fetchWorkZones: PropTypes.func.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectVillage: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    setPatientList: PropTypes.func.isRequired,
    patientList: PropTypes.array.isRequired,
    reduxParams: PropTypes.object.isRequired,
    reduxCount: PropTypes.number.isRequired,
    reduxPages: PropTypes.number.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    patientsFilters: state.patientsFilters,
    filters: state.filters,
    patientList: state.patients.list,
    reduxParams: state.patients.params,
    reduxCount: state.patients.count,
    reduxPages: state.patients.pages,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchTeams: () => dispatch(filterActions.fetchTeams(dispatch)),
    fetchCoordinations: () => dispatch(filterActions.fetchCoordinations(dispatch)),
    fetchProvinces: () => dispatch(filterActions.fetchProvinces(dispatch)),
    fetchWorkZones: () => dispatch(filterActions.fetchWorkZones(dispatch)),
    selectProvince: (provinceId, zoneId, areaId, villageId) => dispatch(filterActions.selectProvince(provinceId, dispatch, zoneId, areaId, villageId)),
    selectVillage: villageId => dispatch(filterActions.selectVillage(villageId, dispatch)),
    selectZone: (zoneId, areaId, villageId) => dispatch(filterActions.selectZone(zoneId, dispatch, false, areaId, villageId)),
    selectArea: (areaId, villageId, zoneId) => dispatch(filterActions.selectArea(areaId, dispatch, false, zoneId, villageId)),
    setPatientList: (patientList, showPagination, params, count, pages) => dispatch(patientsActions.setPatientList(patientList, showPagination, params, count, pages)),
});

const PatientsDuplicatesWithIntl = injectIntl(PatientsDuplicates);

export default connect(MapStateToProps, MapDispatchToProps)(PatientsDuplicatesWithIntl);
