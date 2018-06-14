import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
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

const request = require('superagent');

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
                    console.error('Error when fetching villages details');
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
        return (
            <section>
                <div className="widget__container">
                    <div className="widget__content--tier">
                        <div>
                            <section>
                                <button
                                    className="button--back"
                                    onClick={() => {
                                        const tempParams = this.props.params;
                                        delete tempParams.case_id;
                                        this.props.redirectTo('list', {
                                            ...tempParams,
                                        });
                                    }}
                                >
                                    <i className="fa fa-arrow-left" />
                                </button>
                                <TypeFilters
                                    currentTypes={this.props.locatorState.currentTypes}
                                    selectType={newType =>
                                        this.props.selectType(
                                            newType, this.props.locatorState.areaId,
                                            this.props.locatorState.currentTypes,
                                        )}
                                />
                            </section>
                        </div>
                        <div>
                            <LayersComponent
                                base={baseLayer}
                                change={(type, key) => this.props.changeLayer(type, key)}
                            />
                        </div>
                    </div>
                </div>
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
                            <div className="locator-control-div">
                                {
                                    <div>
                                        <section>
                                            <div>
                                                <Case case={this.props.kase} />
                                            </div>
                                            <div>
                                                <Filters
                                                    filters={this.props.locatorState}
                                                    selectProvince={this.props.selectProvince}
                                                    selectZone={this.props.selectZone}
                                                    selectArea={areaId =>
                                                        this.props.selectArea(
                                                            areaId,
                                                            this.props.locatorState.currentTypes,
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
                                        </section>
                                    </div>}
                                {
                                    this.props.kase.remaining_count &&
                                    <section className="locator-cases-left">
                                        <FormattedMessage
                                            id="locator.label.count"
                                            defaultMessage="Reste"
                                        />
                                        {': '}
                                        {this.props.kase.remaining_count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                                        {' '}
                                        <FormattedMessage
                                            id="locator.label.casesLeft"
                                            defaultMessage="cas non associés"
                                        />
                                    </section>
                                }
                                {!this.props.kase && <div>Plus de cas à traiter!!!!!</div>}
                            </div>
                            <div className="locator-map">
                                <Map
                                    baseLayer={baseLayer}
                                    overlays={overlays}
                                    villages={this.props.locatorState.villages}
                                    selectVillage={villageId => this.props.selectVillage(villageId)}
                                    selectedVillageId={this.props.locatorState.villageId}
                                    getShape={type => this.props.getShape(type)}
                                />
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
};

const LocatorWithIntl = injectIntl(Locator);

function getShapePath(type) {
    console.log('getShapePath', type, AREAS_PATH, ZONES_PATH);
    if (type === 'area') { return AREAS_PATH; }
    if (type === 'zone') { return ZONES_PATH; }

    return null;
}

const MapDispatchToProps = dispatch => ({
    dispatch,
    getShape: type => getRequest(getShapePath(type), dispatch),
    fetchProvinces: () => dispatch(provinceActions.fetchProvinces(dispatch)),
    fetchCase: caseId => dispatch(caseActions.fetchCase(dispatch, caseId)),
    selectProvince: (provinceId) => {
        dispatch(provinceActions.selectProvince(provinceId, dispatch));
        dispatch(locatorActions.emptyAreas());
        dispatch(locatorActions.emptyVillages());
    },
    selectZone: (zoneId) => {
        dispatch(locatorActions.selectZone(zoneId, dispatch));
        dispatch(locatorActions.emptyVillages());
    },
    selectArea: (areaId, currentTypes) => dispatch(locatorActions.selectArea(areaId, currentTypes, dispatch)),
    selectVillage: villageId => dispatch(villageActions.selectVillage(villageId)),
    saveVillage: (kaseId, villageObj, params) => dispatch(villageActions.saveVillage(kaseId, villageObj, params, dispatch)),
    selectType: (newType, areaId, currentTypes) => dispatch(locatorActions.selectType(newType, areaId, currentTypes, dispatch)),
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
