/*
 * This component displays the properties of a given object.
 *
 * The `ROWS` array includes the properties list.
 *
 * The `MESSAGES` object includes the labels needed. If the row type is `message`
 * the possible property values MUST be included as message entry keys.
 * In our case the key `type` represents the village internal classification,
 * `official`, `other` and `unknown`; with this option those values are changed
 * to user readable/understandable texts.
 */

import React, { Component, PropTypes } from 'react';
import Select from 'react-select';
import {
  FormattedDate,
  FormattedMessage,
  FormattedNumber,
  defineMessages,
  injectIntl
} from 'react-intl'
import { saveVillageTeam, saveAreaInGeoloc } from '../../../utils/saveData';
import { clone } from '../../../utils';

const request = require('superagent');
import { capitalize } from '../../../utils'

export const urls = [{
  name: 'village_detail',
  id: 'village_id',
  url: ' /api/villages/',
  mock: [{
    "province": "Kwilu",
    "former_province": "",
    "zs": "Bagata",
    "as": "Bangumi",
    "type": "YES",
    "latitude": -3.4995401,
    "longitude": 17.681,
    "gps_source": "ITM",
    "population": 799,
    "population_year": 2016,
    "population_source": "BCZ BAGATA"
  }]
}];

const MESSAGES = defineMessages({
  province: {
    id: 'microplanning.tooltip.province',
    defaultMessage: 'Province'
  },
  former_province: {
    id: 'microplanning.tooltip.province.former',
    defaultMessage: 'Former province'
  },
  zs: {
    id: 'microplanning.tooltip.zone',
    defaultMessage: 'Zone de sante'
  },
  as: {
    id: 'microplanning.tooltip.area',
    defaultMessage: 'Aire de sante'
  },
  name: {
    id: 'microplanning.tooltip.village',
    defaultMessage: 'Village'
  },
  villagesOfficial: {
    id: 'microplanning.tooltip.villages.official',
    defaultMessage: 'Villages Z.S.'
  },
  villagesOther: {
    id: 'microplanning.tooltip.villages.other',
    defaultMessage: 'Villages non-Z.S.'
  },
  villagesUnknown: {
    id: 'microplanning.tooltip.villages.unknown',
    defaultMessage: 'Villages satellite'
  },
  village_official: {
    id: 'microplanning.tooltip.type',
    defaultMessage: 'Classification'
  },
  latitude: {
    id: 'microplanning.tooltip.latitude',
    defaultMessage: 'Latitude'
  },
  longitude: {
    id: 'microplanning.tooltip.longitude',
    defaultMessage: 'Longitude'
  },
  gps_source: {
    id: 'microplanning.tooltip.gps.source',
    defaultMessage: 'GPS source'
  },

  population: {
    id: 'microplanning.tooltip.population',
    defaultMessage: 'Population'
  },
  population_source: {
    id: 'microplanning.tooltip.population.source',
    defaultMessage: 'Population source'
  },
  population_year: {
    id: 'microplanning.tooltip.population.year',
    defaultMessage: 'Population year'
  },

  lastConfirmedCaseDate: {
    id: 'microplanning.tooltip.case.date',
    defaultMessage: 'Last confirmed HAT case date'
  },
  lastConfirmedCaseYear: {
    id: 'microplanning.tooltip.case.year',
    defaultMessage: 'Last confirmed HAT case year'
  },
  nr_positive_cases: {
    id: 'microplanning.tooltip.cases',
    defaultMessage: 'Confirmed HAT cases'
  },
  team_all: {
    defaultMessage: 'None',
    id: 'microplanning.label.team.all'
  },
  team_select: {
    defaultMessage: 'Unité',
    id: 'microplanning.label.team'
  },
  add_as: {
    defaultMessage: 'Ajouter l\'aire de santé à l\'équipe' ,
    id: 'microplanning.label.add_as'
  },
  remove_as: {
    defaultMessage: 'Supprimer l\'aire de santé de l\'équipe' ,
    id: 'microplanning.label.remove_as'
  },

  // type values
  YES: {
    id: 'microplanning.tooltip.village.type.official',
    defaultMessage: 'from Z.S.'
  },
  NO: {
    id: 'microplanning.tooltip.village.type.notofficial',
    defaultMessage: 'not from Z.S.'
  },
  OTHER: {
    id: 'microplanning.tooltip.village.type.other',
    defaultMessage: 'found during campaigns'
  },
  NA: {
    id: 'microplanning.tooltip.village.type.unknown',
    defaultMessage: 'visible from satellite'
  }
})

const ROWS = [
  { key: 'name' },
  { key: 'zs' },
  { key: 'as' },
  { key: 'province' },
  { key: 'former_province' },
  { key: 'villagesOfficial', type: 'integer' },
  { key: 'villagesOther', type: 'integer' },
  { key: 'villagesUnknown', type: 'integer' },
  { key: 'village_official', type: 'message' },
  { key: 'latitude', type: 'coordinates' },
  { key: 'longitude', type: 'coordinates' },
  { key: 'gps_source' },
  { key: 'population', type: 'integer' },
  { key: 'population_year' },
  { key: 'population_source' },
  { key: 'lastConfirmedCaseDate', type: 'date' },
  { key: 'lastConfirmedCaseYear' },
  { key: 'nr_positive_cases', type: 'integer' }
]

class MapTooltip extends Component {
  constructor(props) {
    super(props);
    this.state = {
      item: props.item,
      teams: props.teams,
      areas: props.areas,
      isloading: true,
      isVillage: false
    }
  }

  componentDidMount() {
    // If this is a village we need to fetch the detail of it
    if (this.state.item.name) {
      this.loadVillageDetail(this.state.item.id);
    } else {
      this.setState({ isloading: false });
    }
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      item: newProps.item,
    })
  }

  updateItemField(value) {
    this.setState({
      item: Object.assign({}, this.state.item, value)
    });
  }

  loadVillageDetail(item_id) {

    this.setState({
      isloading: true,
      isVillage: true
    });

    request
      .get(`/api/villages/${item_id}`)
      .query({ planning_id: this.props.planningId })
      .then((result) => {
        this.updateItemField(result.body);
        this.setState({
          isloading: false,
          selectedTeamId: result.body.team ? result.body.team.id : null,
          isAsInGeoScope: typeof this.props.geoScope[result.body.as_id] !== 'undefined'
        })
      })
      .catch((err) => {
        console.error('Error when fetching villages details');
      });
  }

  onChangeTeam(selectedTeamId) {
    this.setState({ selectedTeamId });
    saveVillageTeam(
      [{ village_id: this.props.item.id, team_id: selectedTeamId }],
      this.props.planningId)
      .then(isSaved => {
        if (isSaved) {
          this.props.updateTeamOnVillage(this.props.item.id, selectedTeamId)
        } else {
          console.error('Error While saving a team for a village');
        }
      })
  }

  toggleAsFromGeoScope(as_id, zs_id, as_name) {
    let tempTeam = {team_id: this.props.teamId};
    if (!this.state.isAsInGeoScope) {
      tempTeam = {...tempTeam, delete:true};
    }
    saveAreaInGeoloc(
      as_id,
      tempTeam)
      .then(isSaved => {
        if (isSaved) {
          let tempGeoScope = clone(this.props.geoScope);
          if (!this.state.isAsInGeoScope) {
            tempGeoScope[as_id] = {id: as_id, name: as_name, zs_id};
          } else {
            delete tempGeoScope[as_id];
          }
          this.props.updateGeoScope(tempGeoScope);
          this.setState({
            isAsInGeoScope : !this.state.isAsInGeoScope
          })
        } else {
          console.error('Error While saving a team for a village');
        }
      })
  }


  render() {
    const { formatMessage } = this.props.intl;
    if (!this.state.item || this.state.isloading) {
      return null;
    }
    return (
      <div key={this.state.item.id} className='map__tooltip'>
        {this.state.item.name && this.props.planningId ? (
          <div className="property">
            <FormattedMessage
              id='microplanning.label.team'
              defaultMessage='Unité' />
            <div>
              <select
                value={this.state.selectedTeamId || ''}
                className="styled-select"
                onChange={event => this.onChangeTeam(event.currentTarget.value)}>
                <option value="none">{formatMessage(MESSAGES['team_all'])}</option>
                {
                  this.state.teams.map((value) => {
                    return (<option key={value.id} value={value.id}>
                      {value.name}
                    </option>)
                  })}
              </select>
            </div>
          </div>) :
          null}
        {
          ROWS
            .filter((row) => {
              return this.state.item[row.key] && this.state.item[row.key] !== '';
            })
            .map((row) => {
              let value = this.state.item[row.key];
              switch (row.type) {
                case 'date':
                  value = <FormattedDate value={value} year='numeric' month='long' day='numeric' />
                  break
                case 'capitalize':
                  value = capitalize(value)
                  break
                case 'coordinates':
                  value = <FormattedNumber value={value} minimumFractionDigits={8} />
                  break
                case 'float':
                  value = <FormattedNumber value={value} minimumFractionDigits={2} />
                  break
                case 'integer':
                  value = <FormattedNumber value={value} />
                  break
                case 'message':
                  value = <FormattedMessage {...MESSAGES[value]} />
                  const temp = <FormattedMessage {...MESSAGES[row.key]} />
                  break
              }

              return (
                <div key={row.key} className='property'>
                  <div className='label'>
                    <FormattedMessage {...MESSAGES[row.key]} />
                  </div>
                  <div className='value'>
                    {value} 
                    {
                      row.key === 'as' && this.props.teamId ?
                        <button
                          title={!this.state.isAsInGeoScope ? formatMessage(MESSAGES['add_as']) : formatMessage(MESSAGES['remove_as'])}
                          className='button--edit small'
                          onClick={() => this.toggleAsFromGeoScope(
                            this.state.item['as_id'],
                            this.state.item['zs_id'],
                            this.state.item['as']
                          )}
                        >
                          {
                            !this.state.isAsInGeoScope ?
                              <i className='fa fa-plus' /> : <i className='fa fa-minus' />}{this.state.isAsInGeoScope}
                        </button> : null
                    }
                  </div>
                </div>
              )
            })
        }
      </div>
    )
  }
}


MapTooltip.propTypes = {
  item: PropTypes.object.isRequired,
  teamId: PropTypes.string,
  teams: PropTypes.arrayOf(PropTypes.object),
  planningId: PropTypes.string,
  updateTeamOnVillage: PropTypes.func.isRequired,
  geoScope: PropTypes.object,
  updateGeoScope:  PropTypes.func.isRequired
}

export default injectIntl(MapTooltip)


