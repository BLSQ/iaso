import React, {Component, PropTypes} from 'react'
import {
  FormattedDate,
  FormattedMessage,
  FormattedNumber,
  defineMessages,
  injectIntl,
  intlShape
} from 'react-intl'
import {capitalize} from '../../../utils'

const MESSAGES = defineMessages({
  zone: {
    id: 'microplanning.tooltip.zone',
    defaultMessage: 'Zonde de Sante'
  },
  area: {
    id: 'microplanning.tooltip.area',
    defaultMessage: 'Aire de Sante'
  },
  village: {
    id: 'microplanning.tooltip.village',
    defaultMessage: 'Village'
  },
  villagesOfficial: {
    id: 'microplanning.tooltip.villages.official',
    defaultMessage: 'Villages'
  },
  villagesOther: {
    id: 'microplanning.tooltip.villages.other',
    defaultMessage: 'Non official'
  },
  villagesUnknown: {
    id: 'microplanning.tooltip.villages.unknown',
    defaultMessage: 'Unknown'
  },
  type: {
    id: 'microplanning.tooltip.type',
    defaultMessage: 'Classification'
  },
  lat: {
    id: 'microplanning.tooltip.latitude',
    defaultMessage: 'Latitude'
  },
  lon: {
    id: 'microplanning.tooltip.longitude',
    defaultMessage: 'Longitude'
  },

  population: {
    id: 'microplanning.tooltip.population',
    defaultMessage: 'Population'
  },
  cases: {
    id: 'microplanning.tooltip.cases',
    defaultMessage: '# Cases'
  },
  caseDate: {
    id: 'microplanning.tooltip.case.date',
    defaultMessage: 'Last case date'
  },
  visitDate: {
    id: 'microplanning.tooltip.visit.date',
    defaultMessage: 'Last visit date'
  },

  // type values
  official: {
    id: 'microplanning.tooltip.village.type.official',
    defaultMessage: 'Official'
  },
  other: {
    id: 'microplanning.tooltip.village.type.other',
    defaultMessage: 'Non official'
  },
  unknown: {
    id: 'microplanning.tooltip.village.type.unknown',
    defaultMessage: 'Unknown'
  }
})

const ROWS = [
  { key: 'zone', type: 'capitalize' },
  { key: 'area', type: 'capitalize' },
  { key: 'villagesOfficial', type: 'integer' },
  { key: 'villagesOther', type: 'integer' },
  { key: 'villagesUnknown', type: 'integer' },
  { key: 'village', type: 'capitalize' },
  { key: 'type', type: 'message' },
  { key: 'lat', type: 'coordinates' },
  { key: 'lon', type: 'coordinates' },
  { key: 'population', type: 'integer' },
  { key: 'cases', type: 'integer' },
  { key: 'caseDate', type: 'date' },
  { key: 'visitDate', type: 'date' }
]

class MapTooltip extends Component {
  render () {
    const {item} = this.props

    return (
      <div key={item._id} className='map__tooltip'>
        {
          ROWS
            .filter((row) => item[row.key] && item[row.key] !== '')
            .map((row) => {
              let value = item[row.key]

              switch (row.type) {
                case 'date':
                  value = <FormattedDate value={value} />
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
  intl: intlShape.isRequired
}

export default injectIntl(MapTooltip)
