import React, {Component, PropTypes} from 'react'
import {
  FormattedDate,
  FormattedMessage,
  FormattedNumber,
  defineMessages,
  injectIntl
} from 'react-intl'

const MESSAGES = defineMessages({
  province: {
    id: 'microplanning.tooltip.province',
    defaultMessage: 'Province'
  },
  ZS: {
    id: 'microplanning.tooltip.zone',
    defaultMessage: 'Zone de Sante'
  },
  AS: {
    id: 'microplanning.tooltip.area',
    defaultMessage: 'Aire de Sante'
  },
  village: {
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
  confirmedCases: {
    id: 'microplanning.tooltip.cases',
    defaultMessage: '# Confirmed Cases'
  },
  lastConfirmedCaseDate: {
    id: 'microplanning.tooltip.case.date',
    defaultMessage: 'Last case date'
  },
  screenedPeople: {
    id: 'microplanning.tooltip.screened',
    defaultMessage: '# Screened people'
  },
  lastScreeningDate: {
    id: 'microplanning.tooltip.screening.date',
    defaultMessage: 'Last screening date'
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
  { key: 'province' },
  { key: 'ZS' },
  { key: 'AS' },
  { key: 'villagesOfficial', type: 'integer' },
  { key: 'villagesOther', type: 'integer' },
  { key: 'villagesUnknown', type: 'integer' },
  { key: 'village' },
  { key: 'type', type: 'message' },
  { key: 'lat', type: 'coordinates' },
  { key: 'lon', type: 'coordinates' },
  { key: 'population', type: 'integer' },
  { key: 'confirmedCases', type: 'integer' },
  { key: 'lastConfirmedCaseDate', type: 'date' },
  { key: 'screenedPeople', type: 'integer' },
  { key: 'lastScreeningDate', type: 'date' }
]

class MapTooltip extends Component {
  render () {
    const {item} = this.props

    return (
      <div key={item.id} className='map__tooltip'>
        {
          ROWS
            .filter((row) => item[row.key] && item[row.key] !== '')
            .map((row) => {
              let value = item[row.key]

              switch (row.type) {
                case 'date':
                  value = <FormattedDate value={value} />
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
  item: PropTypes.object.isRequired
}

export default injectIntl(MapTooltip)
