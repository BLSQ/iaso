import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import Select from 'react-select';
import LoadingSpinner from '../../../components/loading-spinner';
import PeriodSelectorComponent from '../../../components/PeriodSelectorComponent';
import { createUrl } from '../../../utils/fetchData';
import { filterActions } from '../../../redux/filters';

import casesListColumns from '../constants/casesListColumns';
import CustomTableComponent from '../../../components/CustomTableComponent';

import Filters from '../components/Filters';

export const urls = [];

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
            hide_located: 'false',
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

    selectCase(caseItem) {
        console.log(this);
        const url = `/cases/cases/${caseItem.id}?back=${window.location.href}`;
        window.location.href = url;
    }

    selectProvince(provinceId) {
        const {
            params,
            cases,
        } = this.props;
        const tempParams = {
            ...params,
            province_id: provinceId,
        };
        const newProvincesArray = provinceId.split(',');
        if (!provinceId) {
            delete tempParams.province_id;
            delete tempParams.zs_id;
            delete tempParams.as_id;
        } else if (params.province_id && params.zs_id && newProvincesArray.length < params.province_id.split(',').length) {
            let provinceDeleted;
            params.province_id.split(',').map((p) => {
                if (newProvincesArray.indexOf(p.toString()) === -1) {
                    provinceDeleted = p;
                }
                return null;
            });
            const zonesToDelete = cases.zones.filter(z => z.province_id === parseInt(provinceDeleted, 10));
            let areasToDelete = [];
            if (tempParams.as_id) {
                const zsArray = tempParams.zs_id.split(',').slice();
                zonesToDelete.map((z) => {
                    const zoneId = z.id.toString();
                    if (zsArray.indexOf(zoneId) !== -1) {
                        zsArray.splice(zsArray.indexOf(zoneId), 1);
                    }
                    if (params.as_id) {
                        areasToDelete = areasToDelete.concat(cases.areas.filter(a => a.ZS_id === z.id));
                    }
                    return null;
                });
                tempParams.zs_id = zsArray.toString();
            }

            let villagesToDelete = [];
            if (tempParams.as_id) {
                const asArray = tempParams.as_id.split(',').slice();
                areasToDelete.map((a) => {
                    const areaId = a.id.toString();
                    if (asArray.indexOf(areaId) !== -1) {
                        asArray.splice(asArray.indexOf(areaId), 1);
                    }
                    if (params.village_id) {
                        villagesToDelete = villagesToDelete.concat(cases.villages.filter(v => v.AS_id === a.id));
                    }
                    return null;
                });
                tempParams.as_id = asArray.toString();
            }

            if (tempParams.village_id) {
                const villageArray = tempParams.village_id.split(',').slice();
                villagesToDelete.map((a) => {
                    const villageId = a.id.toString();
                    if (villageArray.indexOf(villageId) !== -1) {
                        villageArray.splice(villageArray.indexOf(villageId), 1);
                    }
                    return null;
                });
                tempParams.village_id = villageArray.toString();
            }
        }
        this.props.redirectTo('cases', tempParams);
    }

    selectZone(zoneId) {
        const {
            params,
            cases,
        } = this.props;
        const tempParams = {
            ...this.props.params,
            zs_id: zoneId,
        };

        const newZonesArray = zoneId.split(',');
        if (!zoneId) {
            delete tempParams.zs_id;
            delete tempParams.as_id;
        } else if (params.as_id && newZonesArray.length < params.zs_id.split(',').length) {
            let zoneDeleted;
            params.zs_id.split(',').map((z) => {
                if (newZonesArray.indexOf(z.toString()) === -1) {
                    zoneDeleted = z;
                }
                return null;
            });
            const areasToDelete = cases.areas.filter(a => a.ZS_id === parseInt(zoneDeleted, 10));
            let villagesToDelete = [];
            if (tempParams.as_id) {
                const asArray = tempParams.as_id.split(',').slice();
                areasToDelete.map((a) => {
                    const areaId = a.id.toString();
                    if (asArray.indexOf(areaId) !== -1) {
                        asArray.splice(asArray.indexOf(areaId), 1);
                    }
                    if (params.village_id) {
                        villagesToDelete = villagesToDelete.concat(cases.villages.filter(v => v.AS_id === a.id));
                    }
                    return null;
                });
                tempParams.as_id = asArray.toString();
            }

            if (tempParams.village_id) {
                const villageArray = tempParams.village_id.split(',').slice();
                villagesToDelete.map((a) => {
                    const villageId = a.id.toString();
                    if (villageArray.indexOf(villageId) !== -1) {
                        villageArray.splice(villageArray.indexOf(villageId), 1);
                    }
                    return null;
                });
                tempParams.village_id = villageArray.toString();
            }
        }
        this.props.redirectTo('cases', tempParams);
    }

    selectArea(areaId) {
        const {
            params,
            cases,
        } = this.props;
        const tempParams = {
            ...this.props.params,
            as_id: areaId,
        };
        const newAreasArray = areaId.split(',');
        if (!areaId) {
            delete tempParams.as_id;
            delete tempParams.village_id;
        } else if (params.village_id && newAreasArray.length < params.as_id.split(',').length) {
            let areaDeleted;
            params.as_id.split(',').map((a) => {
                if (newAreasArray.indexOf(a.toString()) === -1) {
                    areaDeleted = a;
                }
                return null;
            });
            const villagesToDelete = cases.villages.filter(v => v.AS_id === parseInt(areaDeleted, 10));

            if (tempParams.village_id) {
                const villageArray = tempParams.village_id.split(',').slice();
                villagesToDelete.map((a) => {
                    const villageId = a.id.toString();
                    if (villageArray.indexOf(villageId) !== -1) {
                        villageArray.splice(villageArray.indexOf(villageId), 1);
                    }
                    return null;
                });
                tempParams.village_id = villageArray.toString();
            }
        }
        this.props.redirectTo('cases', tempParams);
    }

    selectVillage(villageId) {
        this.props.redirectTo('cases', {
            ...this.props.params,
            village_id: villageId,
        });
    }

    render() {
        const { formatMessage } = this.props.intl;
        let { teams, coordinations } = this.props.cases;
        if (!teams) {
            teams = [];
        }
        if (!coordinations) {
            coordinations = [];
        }

        return (
            <section className="cases-list-container">
                {
                    this.props.load.loading && <LoadingSpinner message={formatMessage({
                        defaultMessage: 'Chargement en cours',
                        id: 'microplanning.labels.loading',
                    })}
                    />
                }

                <div className="widget__container">
                    <div className="widget__content list-cases-filters">
                        <Filters
                            isMultiSelect // need to update api to work with multiple ids
                            showVillages
                            isClearable
                            filters={this.props.cases}
                            selectProvince={provindeId => this.selectProvince(provindeId)}
                            selectZone={zsId => this.selectZone(zsId)}
                            selectArea={asId => this.selectArea(asId)}
                            selectVillage={villageId => this.selectVillage(villageId)}
                        />
                    </div>
                </div>

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
                            <div className="widget__label">
                                <FormattedMessage id="cases.label.screening_result" defaultMessage="Dépistage" />
                            </div>
                            <div>
                                <Select
                                    clearable
                                    simpleValue
                                    name="screening_result"
                                    value={this.props.params.screening_result}
                                    placeholder="--"
                                    options={[
                                        {
                                            label: 'Positif',
                                            value: true,
                                        },
                                        {
                                            label: 'Négatif',
                                            value: false,
                                        },
                                    ]}
                                    onChange={(value) => {
                                        const params = {
                                            ...this.props.params,
                                            screening_result: value,
                                        };
                                        this.props.redirectTo('cases', params);
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="widget__label">
                                <FormattedMessage id="cases.label.confirmation_result" defaultMessage="Confirmation" />
                            </div>
                            <div>
                                <Select
                                    clearable
                                    simpleValue
                                    name="confirmation_result"
                                    value={this.props.params.confirmation_result}
                                    placeholder="--"
                                    options={[
                                        {
                                            label: 'Positif',
                                            value: true,
                                        },
                                        {
                                            label: 'Négatif',
                                            value: false,
                                        },
                                    ]}
                                    onChange={(value) => {
                                        const params = {
                                            ...this.props.params,
                                            confirmation_result: value,
                                        };
                                        this.props.redirectTo('cases', params);
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="widget__label">
                                <FormattedMessage id="cases.label.source" defaultMessage="Source" />
                            </div>
                            <div>
                                <Select
                                    clearable
                                    simpleValue
                                    name="source"
                                    value={this.props.params.source}
                                    placeholder="--"
                                    options={[
                                        {
                                            label: 'Sync Tablette',
                                            value: 'mobile_sync',
                                        },
                                        {
                                            label: 'Backup Tablette',
                                            value: 'mobile_backup',
                                        },
                                        {
                                            label: 'Historique',
                                            value: 'historic',
                                        },
                                        {
                                            label: 'Pharmacovigilance',
                                            value: 'pv',
                                        },
                                    ]}
                                    onChange={(value) => {
                                        const params = {
                                            ...this.props.params,
                                            source: value,
                                        };
                                        this.props.redirectTo('cases', params);
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="widget__label">
                                <FormattedMessage id="cases.label.nameSearch" defaultMessage="Recherche textuelle sur le nom" />
                            </div>
                            <div>
                                <input id="searchInput" type="text" defaultValue={this.props.params.search} />
                                <input
                                    type="submit"
                                    onClick={() => {
                                        const text = document.getElementById('searchInput').value;
                                        const params = {
                                            ...this.props.params,
                                            search: text,
                                        };
                                        this.props.redirectTo('cases', params);
                                    }}
                                    value="Rechercher"
                                />
                            </div>
                        </div>

                    </div>
                    <div className="widget__content--quarter">
                        <div>
                            <div className="widget__label">
                                <FormattedMessage id="cases.label.coordination" defaultMessage="Coordination" />
                            </div>
                            <Select
                                clearable
                                simpleValue
                                name="coordination_id"
                                value={this.props.params.coordination_id}
                                placeholder="--"
                                options={
                                    coordinations.map(coordination => ({ label: coordination.name, value: coordination.id }))
                                }
                                onChange={(value) => {
                                    const params = {
                                        ...this.props.params,
                                        coordination_id: value,
                                    };
                                    this.props.redirectTo('cases', params);
                                }}
                            />
                        </div>
                        <div>
                            <div className="widget__label">
                                <FormattedMessage id="cases.label.team" defaultMessage="Equipe" />
                            </div>
                            <Select
                                clearable
                                simpleValue
                                name="team"
                                value={this.props.params.team_id}
                                placeholder="--"
                                options={
                                    teams.map(team => ({ label: team.name, value: team.id }))
                                }
                                onChange={(value) => {
                                    const params = {
                                        ...this.props.params,
                                        team_id: value,
                                    };
                                    this.props.redirectTo('cases', params);
                                }}
                            />
                        </div>
                        <div>
                            <button
                                className="button--save"
                                onClick={() => {
                                    window.location.href = this.getEndpointUrl(true);
                                }}
                            >
                                <i className="fa fa-download" />
                                <FormattedMessage id="cases.label.download" defaultMessage="Télécharger" />
                            </button>
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
                        onRowClicked={caseItem => this.selectCase(caseItem)}
                        multiSort
                    />
                </div>
            </section>
        );
    }
}

Cases.defaultProps = {
    teams: [],
    coordinations: [],
};
Cases.propTypes = {
    load: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    teams: PropTypes.array,
    coordinations: PropTypes.array,
    dispatch: PropTypes.func.isRequired,
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
