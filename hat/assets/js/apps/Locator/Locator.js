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

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages, injectIntl, intlShape } from 'react-intl'
import Select from 'react-select';
import ReactModal from 'react-modal';
import { villageFiltersActions } from './redux/villageFilters'
import { caseActions } from './redux/case'
import Case from './components/Case'
import Filters from './components/Filters'
import TypeFilters from './components/TypeFilters'

const request = require('superagent');

import LoadingSpinner from '../../components/loading-spinner';
import { createUrl, getRequest } from '../../utils/fetchData';


import {
    Map
} from './components';
import { selectionActions } from '../Microplanning/redux/selection'

const MESSAGES = defineMessages({
    'locator-example': {
        defaultMessage: 'Example',
        id: 'locator.labels.example'
    }
})

export class Locator extends Component {
    constructor(props) {
        super(props)

        this.state = {
            villageDetail: null,
            villageId: null,
            isVillageDetailLoading: false
        }
    }

    componentWillReceiveProps(newProps) {
        if (newProps.villageFilters.villageId &&
            (newProps.villageFilters.villageId !== this.props.villageFilters.villageId)) {
            this.setState({
                isVillageDetailLoading: true
            })
            request
                .get(`/api/villages/${newProps.villageFilters.villageId}`)
                .then((response) => {
                    this.setState({
                        villageDetail: response.body,
                        villageId: newProps.villageFilters.villageId,
                        isVillageDetailLoading: false
                    })
                })
                .catch((err) => {
                    this.setState({
                        villageDetail: null,
                        villageId: null,
                        isVillageDetailLoading: false
                    })
                    console.error('Error when fetching villages details');
                });
        } else if (!newProps.villageFilters.villageId && this.props.villageFilters.villageId) {
            this.setState({
                villageDetail: null,
                villageId: null
            })
        }
    }

    render() {

        let baseLayer = 'arcgis-topo'
        let overlays = { labels: false }
        const { formatMessage } = this.props.intl

        return (
            <div className="locator-container widget__container">
                {
                    this.props.load.loading && <LoadingSpinner message={formatMessage({
                        defaultMessage: 'Chargement en cours',
                        id: 'microplanning.labels.loading'
                    })} />
                }
                <div className="locator-control-div">
                    {this.props.kase && <div>
                        <section>
                            <TypeFilters currentTypes={this.props.villageFilters.currentTypes}
                                selectType={newType => this.props.selectType(newType, this.props.villageFilters.areaId, this.props.villageFilters.currentTypes)} />
                        </section>
                        <section>
                            <div>
                                <Case case={this.props.kase}></Case>
                            </div>
                            <div>
                                <Filters filters={this.props.villageFilters}
                                    selectProvince={this.props.selectProvince}
                                    selectZone={this.props.selectZone}
                                    selectArea={areaId => this.props.selectArea(areaId, this.props.villageFilters.currentTypes)}
                                    selectVillage={villageId => this.props.selectVillage(villageId)}
                                />
                                <div className='locator-village-validation'>
                                    {this.state.isVillageDetailLoading &&
                                        <div className='loading-small'>
                                            <i className='fa fa-spinner' />
                                        </div>}
                                    {this.state.villageDetail && !this.state.isVillageDetailLoading && <div>
                                        {this.state.villageDetail.population &&
                                            <p>
                                                <FormattedMessage
                                                    id='microplanning.selected.population'
                                                    defaultMessage='Population estimée' />
                                                {': '}{this.state.villageDetail.population}
                                            </p>}
                                        {this.state.villageDetail.population_source &&
                                            <p>
                                                <FormattedMessage
                                                    id='microplanning.tooltip.population.source'
                                                    defaultMessage='Source de la population' />
                                                {': '}{this.state.villageDetail.population_source}
                                            </p>

                                        }
                                        {this.state.villageDetail.population_year &&
                                            <p>
                                                <FormattedMessage
                                                    id='microplanning.tooltip.population.year'
                                                    defaultMessage='Année relevé population' />
                                                {': '}{this.state.villageDetail.population_year}
                                            </p>

                                        }

                                        <button
                                            className='button--save'
                                            onClick={() => {
                                                this.setState({
                                                    villageDetail: null,
                                                    villageId: null,
                                                })
                                                this.props.saveVillage(this.props.kase.cases[0].id, { village_id: this.state.villageId });
                                            }}
                                        >
                                            <i className='fa fa-save' />
                                            <FormattedMessage id='locator.label.save' defaultMessage='Associer le village au cas' />
                                        </button>
                                    </div>}
                                    <button
                                        className='button--save'
                                        onClick={() => {
                                            this.setState({
                                                villageDetail: null,
                                                villageId: null,
                                            })
                                            this.props.saveVillage(this.props.kase.cases[0].id, { not_found: true });
                                        }}
                                    >
                                        <i className='fa fa-arrow-right' />
                                        <FormattedMessage id='locator.label.next' defaultMessage='Passer au suivant' />
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>}
                    {
                        this.props.kase.remaining_count &&
                        <section className='locator-cases-left'>
                            <FormattedMessage
                                id='locator.label.count'
                                defaultMessage='Reste' />
                            {': '}
                            {this.props.kase.remaining_count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                            {' '}
                            <FormattedMessage
                                id='locator.label.casesLeft'
                                defaultMessage='cas non associés' />
                        </section>
                    }
                    {!this.props.kase && <div>Plus de cas à traiter!!!!!</div>}
                </div>
                <div className='locator-map'>
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
        )
    }
}

/*
  baseLayer: PropTypes.string,
  overlays: PropTypes.object,
  items: PropTypes.arrayOf(PropTypes.object),
  selectionAction: PropTypes.func,
  chosenItem: PropTypes.object,
  showItem: PropTypes.func,
  leafletMap: PropTypes.func,
  intl: intlShape.isRequired,
 */

Locator.propTypes = {
    villageFilters: PropTypes.object,
    kase: PropTypes.object,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    selectVillage: PropTypes.func.isRequired,
    selectType: PropTypes.func.isRequired
};

const LocatorWithIntl = injectIntl(Locator);
const MapDispatchToProps = dispatch => ({
    getShape: type => getRequest(`/static/json/${type}s.json`, dispatch)
});

const MapStateToProps = state => ({
    villageFilters: state.villageFilters,
    load: state.load,
    kase: state.kase
});


export default connect(MapStateToProps, MapDispatchToProps)(LocatorWithIntl);
