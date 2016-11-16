import React, {Component, PropTypes} from 'react'
import {
  defineMessages,
  FormattedMessage,
  injectIntl,
  intlShape
} from 'react-intl'
import ExportCSVButton from '../../../components/export-csv-button'

const MESSAGES = defineMessages({
  'export-zone': {
    id: 'microplanning.export.zone',
    defaultMessage: 'Zone de Sante'
  },
  'export-area': {
    id: 'microplanning.export.area',
    defaultMessage: 'Aire de Sante'
  },
  'export-village': {
    id: 'microplanning.export.village',
    defaultMessage: 'Village'
  },
  'export-type': {
    id: 'microplanning.export.type',
    defaultMessage: 'Official?'
  },
  'export-latitude': {
    id: 'microplanning.export.latitude',
    defaultMessage: 'Latitude'
  },
  'export-longitude': {
    id: 'microplanning.export.longitude',
    defaultMessage: 'Longitude'
  },
  'export-population': {
    id: 'microplanning.export.population',
    defaultMessage: 'Population'
  },
  'export-cases': {
    id: 'microplanning.export.cases',
    defaultMessage: '# Cases'
  },
  'export-case-date': {
    id: 'microplanning.export.case.date',
    defaultMessage: 'Last case date'
  },
  'export-visit-date': {
    id: 'microplanning.export.visit.date',
    defaultMessage: 'Last visit date'
  }
})

const COLUMNS = [
  { message: 'export-zone', key: 'zone' },
  { message: 'export-area', key: 'area' },
  { message: 'export-village', key: 'village' },
  { message: 'export-type', key: 'official' },
  { message: 'export-latitude', key: 'lat', type: 'number' },
  { message: 'export-longitude', key: 'lon', type: 'number' },
  { message: 'export-population', key: 'population', type: 'number' },
  { message: 'export-cases', key: 'cases', type: 'number' },
  { message: 'export-case-date', key: 'caseDate', type: 'date' },
  { message: 'export-visit-date', key: 'visitDate', type: 'date' }
]

class DataSelected extends Component {
  render () {
    const {data, show, unselect} = this.props

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
        <div className='content'>
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
                    <span className='remove' onClick={() => unselect([item])}>
                      <i className='fa fa-close' />
                    </span>
                    <span className='view' onClick={() => show(item, true)}>
                      <i className='fa fa-map-marker' />
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
        </div>

        <div className='actions'>
          <button className='button--warning' onClick={() => unselect([])}>
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
  unselect: PropTypes.func,
  intl: intlShape.isRequired
}

export default injectIntl(DataSelected)
