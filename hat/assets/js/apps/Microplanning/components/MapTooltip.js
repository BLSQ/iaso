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

import React, { Component, PropTypes } from 'react'
import Select from 'react-select'
import {
  FormattedDate,
  FormattedMessage,
  FormattedNumber,
  defineMessages,
  injectIntl
} from 'react-intl'
import { fetchUrl } from '../../../utils/fetchData'
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
    defaultMessage: 'Confirmed HAT cases in that last year'
  },
  team_all: {
    defaultMessage: 'None',
    id: 'microplanning.label.team.all'
  },
  team_select: {
    defaultMessage: 'Team',
    id: 'microplanning.label.team.select'
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
  { key: 'as' },
  { key: 'zs' },
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
    super(props)
    this.state = {
      item: props.item,
      teams: props.teams,
      isloading: true,
      isVillage: false,
      isPlanifiyng: false,
      isPlanified: false,
      selectedTeamId: ''
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
      item: newProps.item
    })
  }

  updateItemField(value) {
    this.setState({
      item: Object.assign({}, this.state.item, value)
    });
  }

  loadVillageDetail(item_id) {
    const isPlanifiyng = this.props.plannings[0] && this.props.plannings[0].assignations;
    let isPlanified = false;
    let selectedTeamId = '';
    if (isPlanifiyng) {
      isPlanified = this.props.plannings[0].assignations.map(assignation => {
        const isPresent = assignation.village_id === item_id;
        if (isPresent) {
          selectedTeamId = assignation.team_id;
        }
        return isPresent;
      });
    }
    this.setState({
      isloading: true,
      isVillage: true,
      isPlanifiyng,
      isPlanified,
      selectedTeamId
    });
    fetchUrl(urls, { village_id: item_id }, '').then((result) => {
      this.updateItemField(result.village_detail);
      this.setState({ isloading: false });
    });
  }


  render() {
    const { formatMessage } = this.props.intl;
    if (!this.state.item || this.state.isloading) {
      return null;
    }
    return (
      <div key={this.state.item.id} className='map__tooltip'>
        {this.state.item.name && this.state.isPlanifiyng ? (
          <div className="property">
            <FormattedMessage
              id='microplanning.label.team.select'
              defaultMessage='Team' />
            <div>
              <select
                value={this.state.selectedTeamId || ''}
                className="styled-select"
                onChange={event => {
                  this.setState({ selectedTeamId: event.currentTarget.value })
              }}>
                <option value="none">{formatMessage(MESSAGES['team_all'])}</option>
                {this.state.teams.map((value) => {
                  return (<option key={value[0]} value={value[0]}>
                            {value[1]}
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
              let value = this.state.item[row.key]
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
  teams: PropTypes.array.isRequired,
  plannings: PropTypes.arrayOf(PropTypes.object)
}

export default injectIntl(MapTooltip)
