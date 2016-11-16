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
  'column-type': {
    id: 'microplanning.column.type',
    defaultMessage: 'Official?'
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
  { message: 'column-type', key: 'official' },
  { message: 'column-latitude', key: 'lat', type: 'number' },
  { message: 'column-longitude', key: 'lon', type: 'number' },
  { message: 'column-population', key: 'population', type: 'number' },
  { message: 'column-cases', key: 'cases', type: 'number' },
  { message: 'column-date', key: 'date', type: 'date' }
]

class DataSelected extends Component {
  render () {
    const {data, show, remove, reset} = this.props

    const sectionTitle = (
      <div className='title'>
        <FormattedMessage id='microplanning.selected.title' defaultMessage='Village selection' />
      </div>
    )

    if (!data || data.length === 0) {
      return (
        <div ref={(node) => (this.container = node)} className='data-selected'>
          {sectionTitle}

          <div className='summary'>
            <div className='text--error'>
              <FormattedMessage id='microplanning.selected.empty' defaultMessage='Nothing selected yet' />
            </div>
          </div>
        </div>
      )
    }

    // calculate number of villages and population
    const number = data.length
    const official = data.filter((item) => item.type === 'official').length
    const other = data.filter((item) => item.type === 'other').length
    const unknown = data.filter((item) => item.type === 'unknown').length
    const population = data.reduce((prev, curr) => (prev + (curr.population || 0)), 0)

    return (
      <div ref={(node) => (this.container = node)} className='data-selected'>
        {sectionTitle}

        <div className='summary'>
          <FormattedMessage
            id='microplanning.selected.number'
            defaultMessage='{
                              number,
                              plural,
                              one {One village}
                              other {{number} villages}
                            } where {
                              official,
                              plural,
                              =0 {none are official}
                              one {one is official}
                              other {{official} are official}
                            }{
                              other,
                              plural,
                              =0 {}
                              one {, one is non official}
                              other {, {other} are non official}
                            } {
                              unknown,
                              plural,
                              =0 {}
                              one {and one is unknown}
                              other {and {unknown} are unknown}
                            }'
            values={{number, official, other, unknown}}
          />
        </div>
        <div className='summary'>
          <FormattedMessage
            id='microplanning.selected.population'
            defaultMessage='{
                              population,
                              plural,
                              =0 {Unknown population}
                              other {{population} estimated population}
                            }'
            values={{population}}
          />
          <div className='text--warning'>
            <FormattedMessage
              id='microplanning.selected.population.warning'
              defaultMessage='Please note:'
            />
            <ul>
              <li>
                <FormattedMessage
                  id='microplanning.selected.population.warning1'
                  defaultMessage='Only official villages have population data.'
                />
              </li>
              <li>
                <FormattedMessage
                  id='microplanning.selected.population.warning2'
                  defaultMessage='Population estimates may not be accurate.'
                />
              </li>
            </ul>
          </div>
        </div>

        <div className='list'>
          <h3>
            <FormattedMessage id='microplanning.selected.list' defaultMessage='Full village list' />
          </h3>
          <ul>
            {data.map((item) => {
              return (
                <li key={item._id}>
                  <span className='remove' onClick={() => remove(item._id)}>
                    <i className='fa fa-close' />
                  </span>
                  <span className='view' onClick={() => show(item)}>
                    <i className='fa fa-map-pin' />
                  </span>

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
        </div>

        <div className='actions'>
          <button className='button--warning' onClick={reset}>
            <i className='fa fa-trash-o' />
            <FormattedMessage id='microplanning.selected.reset' defaultMessage='Reset list' />
          </button>

          <ExportCSVButton data={data} delimiter=',' columns={COLUMNS} messages={MESSAGES} filename='microplanning.csv'>
            <FormattedMessage id='microplanning.selected.export' defaultMessage='Export list' />
          </ExportCSVButton>
        </div>
      </div>
    )
  }
}

DataSelected.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  show: PropTypes.func,
  remove: PropTypes.func,
  reset: PropTypes.func,
  intl: intlShape.isRequired
}

export default injectIntl(DataSelected)
