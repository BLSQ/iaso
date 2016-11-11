import React, {Component, PropTypes} from 'react'
import {
  defineMessages,
  FormattedMessage,
  injectIntl,
  intlShape
} from 'react-intl'
import ExportCSVButton from '../../../components/export-csv-button'

const MESSAGES = defineMessages({
  'column-zs': {
    id: 'microplanning.column.zone',
    defaultMessage: 'Zone de Sante'
  },
  'column-az': {
    id: 'microplanning.column.area',
    defaultMessage: 'Aire de Sante'
  },
  'column-village': {
    id: 'microplanning.column.village',
    defaultMessage: 'Village'
  },
  'column-latitude': {
    id: 'microplanning.column.latitude',
    defaultMessage: 'Latitude'
  },
  'column-longitude': {
    id: 'microplanning.column.longitude',
    defaultMessage: 'Longitude'
  },
  'column-population': {
    id: 'microplanning.column.population',
    defaultMessage: 'Population'
  },
  'column-cases': {
    id: 'microplanning.column.cases',
    defaultMessage: '# Cases'
  },
  'column-date': {
    id: 'microplanning.column.date',
    defaultMessage: 'Last case date'
  }
})

const COLUMNS = [
  { message: 'column-zs', key: 'zone' },
  { message: 'column-az', key: 'area' },
  { message: 'column-village', key: 'village' },
  { message: 'column-latitude', key: 'lat', type: 'number' },
  { message: 'column-longitude', key: 'lon', type: 'number' },
  { message: 'column-population', key: 'population', type: 'number' },
  { message: 'column-cases', key: 'cases', type: 'number' },
  { message: 'column-date', key: 'date', type: 'date' }
]

class DataSelected extends Component {
  render () {
    const {data, remove, reset} = this.props

    if (!data || data.length === 0) {
      return (
        <div ref={(node) => (this.container = node)} className='data-selected'>
          <h3>
            <FormattedMessage id='microplanning.selected.empty' defaultMessage='No villages selected yet' />
          </h3>
        </div>
      )
    }

    // calculate number of villages and population
    const number = data.length
    const population = data.reduce((prev, curr) => (prev + (curr.population || 0)), 0)

    return (
      <div ref={(node) => (this.container = node)} className='data-selected'>
        <div>
          <b>{number}</b> <FormattedMessage id='microplanning.selected.number' defaultMessage='villages selected' />
        </div>
        <div>
          <b>{population}</b> <FormattedMessage id='microplanning.selected.population' defaultMessage='estimated population' />
        </div>
        <hr />

        <h3>
          <FormattedMessage id='microplanning.selected.list' defaultMessage='Selected villages' />
        </h3>
        <ul>
          {data.map((item) => {
            return (
              <li key={item._id}>
                <button onClick={() => remove(item._id)}>
                  <i className='fa fa-close' />
                </button>

                <span>
                  {item.zone}
                  {' - '}
                  {item.area}
                  {' - '}
                  {item.village}
                </span>
              </li>
            )
          })}
        </ul>

        <button className='button' onClick={reset}>
          <FormattedMessage id='microplanning.selected.reset' defaultMessage='Reset list' />
        </button>

        <ExportCSVButton data={data} delimiter=',' columns={COLUMNS} messages={MESSAGES} filename='microplanning.csv'>
          <FormattedMessage id='microplanning.selected.export' defaultMessage='Export list' />
        </ExportCSVButton>
      </div>
    )
  }
}

DataSelected.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  remove: PropTypes.func,
  reset: PropTypes.func,
  intl: intlShape.isRequired
}

export default injectIntl(DataSelected)
