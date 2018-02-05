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

const request = require('superagent');

import LoadingSpinner from '../../components/loading-spinner';
import { createUrl } from '../../utils/fetchData';


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
            villageId: null
        }
    }

    componentWillReceiveProps(newProps) {
        if (newProps.villageFilters.villageId &&
            (newProps.villageFilters.villageId !== this.props.villageFilters.villageId)) {
            request
                .get(`/api/villages/${newProps.villageFilters.villageId}`)
                .then((response) => {
                    this.setState({
                        villageDetail: response.body,
                        villageId: newProps.villageFilters.villageId,
                    })
                })
                .catch((err) => {
                    console.error('Error when fetching villages details');
                });
        } else if (!newProps.villageFilters.villageId && this.props.villageFilters.villageId) {
            this.setState({
                villageDetail: null,
            })
        }
    }

    render() {

        let legend = { YES: true }
        let baseLayer = 'arcgis-topo'
        let overlays = { labels: false }
        return (
            <div className="locator-container widget__container">
                <div className="locator-control-div">
                    {this.props.kase && <div>
                        <Case case={this.props.kase}></Case>
                        <div>
                            <Filters filters={this.props.villageFilters}
                                selectProvince={this.props.selectProvince}
                                selectZone={this.props.selectZone}
                                selectArea={this.props.selectArea}
                                selectVillage={villageId => this.props.selectVillage(villageId)}
                            />
                            <div className='locator-village-validation'>
                                {this.state.villageDetail && <div>
                                    <p>
                                        <FormattedMessage
                                            id='microplanning.selected.population'
                                            defaultMessage='Population estimée' />
                                        {': '}{this.state.villageDetail.population}
                                    </p>
                                    <p>
                                        <FormattedMessage
                                            id='microplanning.tooltip.population.source'
                                            defaultMessage='Source de la population' />
                                        {': '}{this.state.villageDetail.population_source}
                                    </p>
                                    <p>
                                        <FormattedMessage
                                            id='microplanning.tooltip.population.year'
                                            defaultMessage='Année relevé population' />
                                        {': '}{this.state.villageDetail.population_year}
                                    </p>

                                    <button
                                        className='button--save'
                                        onClick={() => {
                                            this.setState({
                                                villageDetail: null,
                                                villageId:  null,
                                            })
                                            this.props.saveVillage(this.props.kase.id, { village_id: this.state.villageId });
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
                                            villageId:  null,
                                        })
                                        this.props.saveVillage(this.props.kase.id, { not_found: true });
                                    }}
                                >
                                    <i className='fa fa-arrow-right' />
                                    <FormattedMessage id='locator.label.next' defaultMessage='Passer au suivant' />
                                </button>
                            </div>
                        </div>
                    </div>}
                    {!this.props.kase && <div>Plus de cas à traiter!!!!!</div>}
                </div>
                <div className='locator-map'>
                    <Map
                        baseLayer={baseLayer}
                        overlays={overlays}
                        legend={legend}
                        villages={this.props.villageFilters.villages}
                        selectVillage={villageId => this.props.selectVillage(villageId)}
                        selectedVillageId={this.props.villageFilters.villageId}
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
    selectVillage: PropTypes.func.isRequired
};

const LocatorWithIntl = injectIntl(Locator);
const MapDispatchToProps = dispatch => ({
});

const MapStateToProps = state => ({
    villageFilters: state.villageFilters,
    kase: state.kase
});


export default connect(MapStateToProps, MapDispatchToProps)(LocatorWithIntl);
