import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import Case from '../components/Case';
import Filters from '../components/Filters';
import TypeFilters from '../components/TypeFilters';

import { locatorActions } from '../redux/locator';
import { provinceActions } from '../redux/province';
import { villageActions } from '../redux/village';
import { caseActions } from '../redux/case';
import { loadActions } from '../../../redux/load';
import { mapActions } from '../redux/mapReducer';

import LoadingSpinner from '../../../components/loading-spinner';
import { getRequest, createUrl } from '../../../utils/fetchData';
import LayersComponent from '../../../components/LayersComponent';


import { Map } from '../components';
import Search from '../../../components/Search';

const request = require('superagent');


const MESSAGES = defineMessages({
    searchPlaceholder: {
        defaultMessage: 'Taper ici pour chercher dans la liste de tous les villages',
        id: 'search.placeholder.all',
    },
    searchNoResult: {
        defaultMessage: 'Aucun village trouvé',
        id: 'search.result.none',
    },
    searchResult: {
        defaultMessage: 'resultat(s)',
        id: 'search.result',
    },
    searchMinChar: {
        defaultMessage: 'Taper au moins 2 charactères',
        id: 'search.result.minChar',
    },
    villageNameLabel: {
        defaultMessage: 'Nom',
        id: 'search.result.villageName',
    },
    populationLabel: {
        defaultMessage: 'Pop.',
        id: 'search.result.populationLabel',
    },
    provinceLabel: {
        defaultMessage: 'Prov.',
        id: 'search.result.provinceLabel',
    },
    zsLabel: {
        defaultMessage: 'Zs',
        id: 'search.result.zsLabel',
    },
    asLabel: {
        defaultMessage: 'As',
        id: 'search.result.asLabel',
    },
});

export class Locator extends Component {
    constructor(props) {
        super(props);

        this.state = {
            villageDetail: null,
            villageId: null,
            isVillageDetailLoading: false,
        };
    }

    componentDidMount() {
        const { dispatch } = this.props;
        dispatch(loadActions.startLoading());
        dispatch(locatorActions.resetFilters());
        this.props.fetchProvinces();
        this.props.fetchCase(this.props.params.case_id);
    }

    componentWillReceiveProps(newProps) {
        if (newProps.locatorState.villageId && (newProps.locatorState.villageId !==
            this.props.locatorState.villageId)) {
            this.setState({
                isVillageDetailLoading: true,
            });
            request
                .get(`/api/villages/${newProps.locatorState.villageId}`)
                .then((response) => {
                    this.setState({
                        villageDetail: response.body,
                        villageId: newProps.locatorState.villageId,
                        isVillageDetailLoading: false,
                    });
                })
                .catch((err) => {
                    this.setState({
                        villageDetail: null,
                        villageId: null,
                        isVillageDetailLoading: false,
                    });
                    console.error(`Error when fetching villages details: ${err}`);
                });
        } else if (!newProps.locatorState.villageId && this.props.locatorState.villageId) {
            this.setState({
                villageDetail: null,
                villageId: null,
            });
        }
    }

    render() {
        const { baseLayer } = this.props.map;
        const overlays = { labels: false };
        const { formatMessage } = this.props.intl;
        const { dispatch } = this.props;
        const searchResultsKeys = [
            { value: 'name', translation: formatMessage(MESSAGES.villageNameLabel) },
            { value: 'population', translation: formatMessage(MESSAGES.populationLabel) },
            { value: 'AS__ZS__province__name', translation: formatMessage(MESSAGES.provinceLabel) },
            { value: 'AS__ZS__name', translation: formatMessage(MESSAGES.zsLabel) },
            { value: 'AS__name', translation: formatMessage(MESSAGES.asLabel) },
        ];
        return (
            <section>
                {this.props.kase &&
                    <div className="widget__container">
                        <div className="widget__content--tier locator-control-div">
                            <div>
                                <button
                                    className="button--back"
                                    onClick={() => {
                                        const tempParams = this.props.params;
                                        delete tempParams.case_id;
                                        dispatch(locatorActions.resetFilters());
                                        this.props.redirectTo('list', {
                                            ...tempParams,
                                        });
                                    }}
                                >
                                    <i className="fa fa-arrow-left" />{' '}
                                </button>
                                <Case case={this.props.kase} />
                            </div>
                            <div>
                                <div className="locator-title">
                                    <FormattedMessage id="locator.label.search" defaultMessage="Recherche du village" />
                                </div>
                                <Filters
                                    isClearable
                                    filters={this.props.locatorState}
                                    selectProvince={provinceId => this.props.selectProvince(provinceId)}
                                    selectZone={zoneId => this.props.selectZone(
                                        zoneId,
                                        this.props.locatorState.currentTypes,
                                    )}
                                    selectArea={areaId =>
                                        this.props.selectArea(
                                            areaId,
                                            this.props.locatorState.currentTypes,
                                            this.props.locatorState.zoneId,
                                        )}
                                    selectVillage={villageId =>
                                        this.props.selectVillage(villageId)}
                                />
                                <div className="locator-village-validation">
                                    {
                                        this.state.isVillageDetailLoading &&
                                        <div className="loading-small">
                                            <i className="fa fa-spinner" />
                                        </div>
                                    }
                                    {
                                        this.state.villageDetail &&
                                        !this.state.isVillageDetailLoading &&
                                        <div>
                                            {
                                                this.state.villageDetail.population &&
                                                <p>
                                                    <FormattedMessage
                                                        id="microplanning.selected.population"
                                                        defaultMessage="Population estimée"
                                                    />
                                                    {': '}{this.state.villageDetail.population}
                                                </p>
                                            }
                                            {
                                                this.state.villageDetail.population_source &&
                                                <p>
                                                    <FormattedMessage
                                                        id="microplanning.tooltip.population.source"
                                                        defaultMessage="Source de la population"
                                                    />
                                                    {': '}{this.state.villageDetail.population_source}
                                                </p>
                                            }
                                            {
                                                this.state.villageDetail.population_year &&
                                                <p>
                                                    <FormattedMessage
                                                        id="microplanning.tooltip.population.year"
                                                        defaultMessage="Année relevé population"
                                                    />
                                                    {': '}{this.state.villageDetail.population_year}
                                                </p>
                                            }
                                            <button
                                                className="button--save"
                                                onClick={() => {
                                                    this.props.saveVillage(
                                                        this.props.kase.id,
                                                        { village_id: this.state.villageId },
                                                        this.props.params,
                                                    );
                                                }}
                                            >
                                                <i className="fa fa-save" />
                                                <FormattedMessage id="locator.label.save" defaultMessage="Associer le village au cas" />
                                            </button>
                                        </div>}
                                    <button
                                        className="button--save"
                                        onClick={() => {
                                            this.props.saveVillage(this.props.kase.id, { not_found: true }, this.props.params);
                                        }}
                                    >
                                        <i className="fa fa-arrow-right" />
                                        <FormattedMessage id="locator.label.not_found" defaultMessage="Non trouvé" />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div className="locator-title">
                                    <FormattedMessage id="locator.label.searchAllByVillage" defaultMessage="Recherche textuelle (par village)" />
                                </div>
                                <Search
                                    placeholderText={formatMessage(MESSAGES.searchPlaceholder)}
                                    resultText={formatMessage(MESSAGES.searchResult)}
                                    noResultText={formatMessage(MESSAGES.searchNoResult)}
                                    noEnoughText={formatMessage(MESSAGES.searchMinChar)}
                                    minCharCount={1}
                                    onSearch={value => this.props.searchVillage(value)}
                                    resetSearch={() => this.props.resetSearch()}
                                    results={this.props.locatorState.searchResults}
                                    isLoading={this.props.locatorState.searchLoading}
                                    keys={searchResultsKeys}
                                    onSelect={village => this.props.selectProvince(village.AS__ZS__province__id, village.AS__ZS__id, village.AS_id, village.id)}
                                />
                            </div>
                        </div>
                    </div>
                }
                <div className="locator-container widget__container">
                    {
                        this.props.load.loading &&
                        <div className="widget__content">
                            <LoadingSpinner message={formatMessage({
                                defaultMessage: 'Chargement en cours',
                                id: 'microplanning.labels.loading',
                            })}
                            />
                        </div>
                    }
                    {this.props.kase &&
                        <div>
                            <div className="split-selector-container ">
                                <LayersComponent
                                    base={baseLayer}
                                    change={(type, key) => this.props.changeLayer(type, key)}
                                />
                                <TypeFilters
                                    currentTypes={this.props.locatorState.currentTypes}
                                    selectType={newType =>
                                        this.props.selectType(
                                            newType, this.props.locatorState.zoneId, this.props.locatorState.areaId,
                                            this.props.locatorState.currentTypes,
                                        )}
                                />
                            </div>
                            <div className="split-map ">
                                {
                                    this.props.locatorState.villages &&
                                        <Map
                                            baseLayer={baseLayer}
                                            overlays={overlays}
                                            villages={this.props.locatorState.villages}
                                            selectVillage={villageId => this.props.selectVillage(villageId)}
                                            selectedVillageId={this.props.locatorState.villageId}
                                            getShape={type => this.props.getShape(type)}
                                        />
                                }
                            </div>
                        </div>
                    }
                </div>
            </section>
        );
    }
}

Locator.defaultProps = {
    kase: null,
};

Locator.propTypes = {
    intl: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    locatorState: PropTypes.object.isRequired,
    kase: PropTypes.object,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    searchVillage: PropTypes.func.isRequired,
    saveVillage: PropTypes.func.isRequired,
    getShape: PropTypes.func.isRequired,
    selectVillage: PropTypes.func.isRequired,
    selectType: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    fetchProvinces: PropTypes.func.isRequired,
    fetchCase: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    changeLayer: PropTypes.func.isRequired,
    map: PropTypes.object.isRequired,
    resetSearch: PropTypes.func.isRequired,
};

const LocatorWithIntl = injectIntl(Locator);

const getShapePath = (type) => {
    if (type === 'area') { return AREAS_PATH; }
    if (type === 'zone') { return ZONES_PATH; }

    return null;
};

const MapDispatchToProps = dispatch => ({
    dispatch,
    getShape: type => getRequest(getShapePath(type), dispatch),
    fetchProvinces: () => dispatch(provinceActions.fetchProvinces(dispatch)),
    fetchCase: caseId => dispatch(caseActions.fetchCase(dispatch, caseId)),
    selectProvince: (provinceId, zoneId, areaId, villageId) => dispatch(provinceActions.selectProvince(provinceId, dispatch, zoneId, areaId, villageId)),
    selectZone: (zoneId, currentTypes) => dispatch(locatorActions.selectZone(zoneId, currentTypes, dispatch, true)),
    selectArea: (areaId, currentTypes, zoneId) => dispatch(locatorActions.selectArea(areaId, currentTypes, dispatch, true, zoneId)),
    searchVillage: (search, provinceId, zoneId, areaId) => dispatch(locatorActions.searchVillage(search, dispatch, provinceId, zoneId, areaId)),
    selectVillage: villageId => dispatch(villageActions.selectVillage(villageId)),
    resetSearch: () => dispatch(locatorActions.resetSearch()),
    saveVillage: (kaseId, villageObj, params) => dispatch(villageActions.saveVillage(kaseId, villageObj, params, dispatch)),
    selectType: (newType, zoneId, areaId, currentTypes) => dispatch(locatorActions.selectType(newType, zoneId, areaId, currentTypes, dispatch)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key)),
});

const MapStateToProps = state => ({
    load: state.load,
    locatorState: state.locator,
    kase: state.kase.case,
    map: state.map,
});


export default connect(MapStateToProps, MapDispatchToProps)(LocatorWithIntl);
