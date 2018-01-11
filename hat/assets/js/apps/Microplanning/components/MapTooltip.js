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
    defaultMessage: 'All teams',
    id: 'microplanning.label.team.all'
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
      isloading: true
    }

  }

  componentDidMount() {
    // If this is a village we need to fetch the detail of it
    if (this.state.item.name) {
      this.loadData(this.state.item.id);
    } else {
      this.setState({isloading: false});
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

  loadData(item_id) {
    this.setState({isloading: true});
    fetchUrl(urls, {village_id: item_id}, '').then((result) =>{
      this.updateItemField(result.village_detail);
      this.setState({isloading: false});
    });
  }

  render() {
    const team = null;
    const { formatMessage } = this.props.intl;
    if (!this.state.item || this.state.isloading) {
      return null;
    }
    return (
      <div key={this.state.item.id} className='map__tooltip'>
        {this.state.item.name ? (
          <div className="property">
            <Select
              simpleValue
              autosize={false}
              name='teams'
              value={team || ''}
              placeholder={formatMessage(MESSAGES['team_all'])}
              options={this.props.teams.map((value) => ({ label: value[1], value: value[1] }))}
              onChange={teams => this.updateVillageTeam()}
            />
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
  teams: PropTypes.array.isRequired
}

export default injectIntl(MapTooltip)
