/*
 * The Microplanning component is responsible of the micro-planning process
 *
 * It has a few behaviors:
 * - load and filter data
 * - display the map
 * - execute the selection actions
 * - export to Excel the selected list
 * - print/export map view
 *
  */

/* eslint "max-len": [1, 200], */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Case from './components/Case';
import Filters from './components/Filters';
import TypeFilters from './components/TypeFilters';


import LoadingSpinner from '../../components/loading-spinner';
import { getRequest } from '../../utils/fetchData';


import {
    Map,
    CaseList,
} from './components';

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

    componentWillReceiveProps(newProps) {
        if (newProps.villageFilters.villageId && (newProps.villageFilters.villageId !==
            this.props.villageFilters.villageId)) {
            this.setState({
                isVillageDetailLoading: true,
            });
            request
                .get(`/api/villages/${newProps.villageFilters.villageId}`)
                .then((response) => {
                    this.setState({
                        villageDetail: response.body,
                        villageId: newProps.villageFilters.villageId,
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
        } else if (!newProps.villageFilters.villageId && this.props.villageFilters.villageId) {
            this.setState({
                villageDetail: null,
                villageId: null,
            });
        }
    }

    render() {
        const baseLayer = 'arcgis-topo';
        const overlays = { labels: false };
        const { formatMessage } = this.props.intl;
        return (
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
                {this.props.kase.list &&
                    <CaseList list={this.props.kase.list} />
                }
                {this.props.kase.case &&
                    <div>
                        <div className="locator-control-div">
                            {this.props.kase.case &&
                                <div>
                                    <section>
                                        <TypeFilters
                                            currentTypes={this.props.villageFilters.currentTypes}
                                            selectType={newType =>
                                                this.props.selectType(
                                                    newType, this.props.villageFilters.areaId,
                                                    this.props.villageFilters.currentTypes,
                                                )}
                                        />
                                    </section>
                                    <section>
                                        <div>
                                            <Case case={this.props.kase.case} />
                                        </div>
                                        <div>
                                            <Filters
                                                filters={this.props.villageFilters}
                                                selectProvince={this.props.selectProvince}
                                                selectZone={this.props.selectZone}
                                                selectArea={areaId =>
                                                    this.props.selectArea(
                                                        areaId,
                                                        this.props.villageFilters.currentTypes,
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
                                                                this.setState({
                                                                    villageDetail: null,
                                                                    villageId: null,
                                                                });
                                                                this.props.saveVillage(
                                                                    this.props.kase.case.cases[0].id,
                                                                    { village_id: this.state.villageId },
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
                                                        this.setState({
                                                            villageDetail: null,
                                                            villageId: null,
                                                        });
                                                        this.props.saveVillage(this.props.kase.case.cases[0].id, { not_found: true });
                                                    }}
                                                >
                                                    <i className="fa fa-arrow-right" />
                                                    <FormattedMessage id="locator.label.next" defaultMessage="Passer au suivant" />
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
                                villages={this.props.villageFilters.villages}
                                selectVillage={villageId => this.props.selectVillage(villageId)}
                                selectedVillageId={this.props.villageFilters.villageId}
                                getShape={type => this.props.getShape(type)}
                            />
                        </div>
                    </div>
                }
            </div>
        );
    }
}

Locator.defaultProps = {
    list: null,
};

Locator.propTypes = {
    intl: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    villageFilters: PropTypes.object.isRequired,
    kase: PropTypes.object.isRequired,
    list: PropTypes.object,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    saveVillage: PropTypes.func.isRequired,
    getShape: PropTypes.func.isRequired,
    selectVillage: PropTypes.func.isRequired,
    selectType: PropTypes.func.isRequired,
};

const LocatorWithIntl = injectIntl(Locator);
const MapDispatchToProps = dispatch => ({
    getShape: type => getRequest(`/static/json/${type}s.json`, dispatch),
});

const MapStateToProps = state => ({
});


export default connect(MapStateToProps, MapDispatchToProps)(LocatorWithIntl);
