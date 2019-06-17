import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import LoadingSpinner from '../../../components/loading-spinner';
import { createUrl } from '../../../utils/fetchData';
import { filterActions } from '../../../redux/filtersRedux';

import duplicateListColumns from '../constants/duplicateListColumns';
import CustomTableComponent from '../../../components/CustomTableComponent';
import DownloadButtonsComponent from '../../../components/DownloadButtonsComponent';
import ChoosePeriodSelectorComponent from '../../../components/ChoosePeriodSelectorComponent';
import FiltersComponent from '../../../components/FiltersComponent';
import { currentUserActions } from '../../../redux/currentUserReducer';
import SearchButton from '../../../components/SearchButton';
import { patientsActions } from '../redux/patients';

import {
    filtersPatients,
    filtersPatientsDuplicates,
    filtersDuplicatesPatientsSearch,
    filtersPatientsGeo,
} from '../constants/filtersSelect';


const baseUrl = 'register/duplicates';

class PatientsDuplicates extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: duplicateListColumns(props.intl.formatMessage),
            tableUrl: null,
        };
    }

    componentWillMount() {
        if (this.props.params.back) {
            this.onSearch();
            const { params } = this.props;
            delete params.back;
            this.props.redirectTo(baseUrl, params);
        }
        Promise.all([
            this.props.fetchProvinces(),
            this.props.fetchTeams(),
            this.props.fetchCoordinations(),
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

    onSearch() {
        this.setState({
            tableUrl: this.getEndpointUrl(),
        });
    }

    getEndpointUrl(toExport, exportType = 'cv') {
        let url = '/api/patientduplicates/?full=true';
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

        if (urlParams.patient_id_2) {
            delete urlParams.patient_id_2;
        }

        if (urlParams.duplicate_id) {
            delete urlParams.duplicate_id;
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

    selectDuplicate(duplicate) {
        const { params } = this.props;

        const newParams = {
            patient_id: duplicate.patient1.id,
            patient_id_2: duplicate.patient2.id,
            duplicate_id: duplicate.id,
            ...params,
        };

        this.props.redirectTo('register/duplicates/detail', newParams);
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
            },
            params,
            reduxPage,
            setDuplicatePatientList,
        } = this.props;
        const filters1 = filtersPatients(formatMessage);
        const filters2 = filtersPatientsDuplicates(coordinations || [], teams || []);
        const search = filtersDuplicatesPatientsSearch(this);
        const geo = filtersPatientsGeo(
            provinces || [],
            zones || [],
            areas || [],
            villages || [],
            this.props,
            baseUrl,
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
                        <h2 className="widget__heading"><FormattedMessage id="datas.duplicates.header.title" defaultMessage="Doublons" /></h2>
                    </div>
                    <div className="border-bottom">
                        <ChoosePeriodSelectorComponent
                            params={this.props.params}
                            baseUrl={baseUrl}
                            redirectTo={this.props.redirectTo}
                            showApplybutton={false}
                        />
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
                                filters={filters2}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl={baseUrl}
                                filters={filters1}
                            />
                        </div>
                    </div>
                    <SearchButton onSearch={() => this.onSearch()} />
                </div>
                {
                    this.state.tableUrl &&
                    <div className="widget__container  no-border">
                        <CustomTableComponent
                            isSortable
                            showPagination
                            endPointUrl={this.state.tableUrl}
                            columns={this.state.tableColumns}
                            defaultSorted={[{ id: 'id', desc: false }]}
                            params={params}
                            defaultPath={baseUrl}
                            dataKey="patientduplicatepairs"
                            onRowClicked={duplicateItem => this.selectDuplicate(duplicateItem)}
                            multiSort
                            onDataLoaded={(newDuplicatePatientList, count, pages) => setDuplicatePatientList(newDuplicatePatientList, true, params, count, pages)}
                            reduxPage={reduxPage}
                        />
                        <div className="align-right">
                            <DownloadButtonsComponent
                                csvUrl={this.getEndpointUrl(true, 'csv')}
                                xlsxUrl={this.getEndpointUrl(true, 'xlsx')}
                            />
                        </div>
                    </div>
                }
            </section>
        );
    }
}
PatientsDuplicates.defaultProps = {
    reduxPage: undefined,
};


PatientsDuplicates.propTypes = {
    load: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    filters: PropTypes.object.isRequired,
    fetchProvinces: PropTypes.func.isRequired,
    fetchTeams: PropTypes.func.isRequired,
    fetchCoordinations: PropTypes.func.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectVillage: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    fetchCurrentUserInfos: PropTypes.func.isRequired,
    reduxPage: PropTypes.object,
    setDuplicatePatientList: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    filters: state.patientsFilters,
    reduxPage: state.patients.patientsDuplicatePage,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchTeams: () => dispatch(filterActions.fetchTeams(dispatch)),
    fetchCoordinations: () => dispatch(filterActions.fetchCoordinations(dispatch)),
    fetchProvinces: () => dispatch(filterActions.fetchProvinces(dispatch)),
    selectProvince: (provinceId, zoneId, areaId, villageId) => dispatch(filterActions.selectProvince(provinceId, dispatch, zoneId, areaId, villageId)),
    selectVillage: villageId => dispatch(filterActions.selectVillage(villageId, dispatch)),
    selectZone: (zoneId, areaId, villageId) => dispatch(filterActions.selectZone(zoneId, dispatch, true, areaId, villageId)),
    selectArea: (areaId, villageId, zoneId) => dispatch(filterActions.selectArea(areaId, dispatch, true, zoneId, villageId)),
    fetchCurrentUserInfos: () => dispatch(currentUserActions.fetchCurrentUserInfos(dispatch)),
    setDuplicatePatientList: (duplicatePatientList, showPagination, params, count, pages) => dispatch(patientsActions.setDuplicatePatientList(duplicatePatientList, showPagination, params, count, pages)),
});

const PatientsDuplicatesWithIntl = injectIntl(PatientsDuplicates);

export default connect(MapStateToProps, MapDispatchToProps)(PatientsDuplicatesWithIntl);
