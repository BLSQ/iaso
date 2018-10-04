import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import LoadingSpinner from '../../../components/loading-spinner';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import { createUrl } from '../../../utils/fetchData';
import { filterActions } from '../../../redux/filters';

import casesListColumns from '../constants/casesListColumns';
import CustomTableComponent from '../../../components/CustomTableComponent';

import FiltersComponent from '../../../components/FiltersComponent';
import { filtersZone1, filtersZone2, filtersSearch, filtersGeo } from '../constants/casesFilters';

export const urls = [];


const selectCase = (caseItem, event) => {
    let url = `/cases/cases/${caseItem.id}?back=${window.location.href}`;
    if (event.currentTarget.children[0] && event.currentTarget.children[0].classList[1] === 'not-located') {
        url = `/dashboard/locator/case_id/${caseItem.id}`;
        window.open(url, '_blank');
    } else {
        window.location.href = url;
    }
};

class Cases extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: casesListColumns(props.intl.formatMessage),
        };
    }

    componentWillMount() {
        Promise.all([
            this.props.fetchProvinces(), this.props.fetchTeams(), this.props.fetchCoordinations(),
        ]).then(() => {
            if (this.props.params.province_id) {
                this.props.selectProvince(this.props.params.province_id);
            }
            if (this.props.params.zs_id) {
                this.props.selectZone(this.props.params.zs_id, this.props.params.as_id, this.props.params.village_id);
            }
            if (this.props.params.as_id) {
                this.props.selectArea(this.props.params.as_id, this.props.params.village_id);
            }
            if (this.props.params.village_id) {
                this.props.selectVillage(this.props.params.village_id);
            }
        });
    }

    componentWillReceiveProps(newProps) {
        if (newProps.params.province_id !== this.props.params.province_id) {
            this.props.selectProvince(newProps.params.province_id);
        }
        if (newProps.params.zs_id !== this.props.params.zs_id) {
            this.props.selectZone(newProps.params.zs_id, newProps.params.as_id, newProps.params.village_id);
        }
        if (newProps.params.as_id !== this.props.params.as_id) {
            this.props.selectArea(newProps.params.as_id, newProps.params.village_id);
        }
        if (newProps.params.village_id !== this.props.params.village_id) {
            this.props.selectVillage(newProps.params.village_id);
        }
    }

    getEndpointUrl(forCsv) {
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

        if (forCsv) {
            urlParams.csv = true;
        }

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value) {
                url += `&${key}=${value}`;
            }
        });
        return url;
    }

    render() {
        const { formatMessage } = this.props.intl;
        const {
            cases: {
                teams,
                coordinations,
                provinces,
                zones,
                areas,
                villages,
            },
        } = this.props;
        const filters1 = filtersZone1(formatMessage, defineMessages);
        const filters2 = filtersZone2(formatMessage, defineMessages, coordinations || [], teams || [], this.props.params.located === 'only_not_located');
        const search = filtersSearch();
        const geo = filtersGeo(
            provinces || [],
            zones || [],
            areas || [],
            villages || [],
            this.props,
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
                    <div className="widget__header widget__content--quarter">
                        <PeriodSelectorComponent
                            dateFrom={this.props.params.date_from}
                            dateTo={this.props.params.date_to}
                            onChangeDate={(dateFrom, dateTo) =>
                                this.props.redirectTo('cases', {
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
                                baseUrl="cases"
                                filters={geo}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl="cases"
                                filters={search}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl="cases"
                                filters={filters1}
                            />
                        </div>
                        <div>
                            <FiltersComponent
                                params={this.props.params}
                                baseUrl="cases"
                                filters={filters2}
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
                        defaultSorted={[{ id: 'form_year', desc: false }]}
                        params={this.props.params}
                        defaultPath="cases"
                        dataKey="cases"
                        onRowClicked={(caseItem, state, event) => selectCase(caseItem, event)}
                        multiSort
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

Cases.propTypes = {
    load: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    cases: PropTypes.object.isRequired,
    fetchProvinces: PropTypes.func.isRequired,
    fetchTeams: PropTypes.func.isRequired,
    fetchCoordinations: PropTypes.func.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectVillage: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    load: state.load,
    cases: state.cases,
    filters: state.filters,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    fetchTeams: () => dispatch(filterActions.fetchTeams(dispatch)),
    fetchCoordinations: () => dispatch(filterActions.fetchCoordinations(dispatch)),
    fetchProvinces: () => dispatch(filterActions.fetchProvinces(dispatch)),
    selectProvince: provinceId => dispatch(filterActions.selectProvince(provinceId, dispatch)),
    selectVillage: villageId => dispatch(filterActions.selectVillage(villageId, dispatch)),
    selectZone: (zoneId, areaId, villageId) => dispatch(filterActions.selectZone(zoneId, dispatch, true, areaId, villageId)),
    selectArea: (areaId, villageId) => dispatch(filterActions.selectArea(areaId, dispatch, true, null, villageId)),
});

const CasesWithIntl = injectIntl(Cases);

export default connect(MapStateToProps, MapDispatchToProps)(CasesWithIntl);
