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
    const {data, unselect} = this.props

    const sectionTitle = (
      <div className='map__selection__title'>
        <FormattedMessage id='microplanning.selected.title' defaultMessage='Village selection' />
      </div>
    )

    if (!data || data.length === 0) {
      return (
        <div ref={(node) => (this.container = node)} className='map__selection'>
          <div className='map__selection__content'>
            {sectionTitle}
            <div className='map__selection__summary--empty'>
              <FormattedMessage id='microplanning.selected.empty' defaultMessage='Nothing selected yet' />
            </div>
          </div>
        </div>
      )
    }

    // calculate number of villages and population
    const number = data.length
    const population = data.reduce((prev, curr) => (prev + (curr.population || 0)), 0)

    return (
      <div ref={(node) => (this.container = node)} className='map__selection'>
        <div className='map__selection__content'>
          {sectionTitle}
          <div className='map__selection__summary'>

            <h4 className='map__selection__summary__heading'>Your selection includes:</h4>

            <div className='map__selection__summary__item'>
              <FormattedMessage
                id='microplanning.selected.number'
                defaultMessage='Villages'
              />
              <span className='map__selection__summary__number'>{number}</span>
            </div>
            <div className='map__selection__summary__item'>
              <FormattedMessage
                id='microplanning.selected.population'
                defaultMessage='Estimated population'
              />
              <span className='map__selection__summary__number'>{population}</span>
            </div>

            <div className='map__text--warning'>
              <FormattedMessage
                id='microplanning.selected.population.warning'
                defaultMessage='Please note: Population estimates may not be accurate. '
              />
              <FormattedMessage
                id='microplanning.selected.population.warning1'
                defaultMessage='Only official villages have population data.'
              />
            </div>
          </div>

          <h3>
            <FormattedMessage id='microplanning.selected.list' defaultMessage='Villages in your selection:' />
          </h3>
          <ul className='map__selection__list'>
            <a onClick={() => unselect([])}>
              <FormattedMessage id='microplanning.selected.reset' defaultMessage='Reset list' />
            </a>
            {data.map((item) => {
              return (
                <li className='map__selection__list__item' key={item._id}>
                  {
                  /*
                  <span className='view' onClick={() => show(item, true)}>
                    <i className='fa fa-map-marker' />
                  </span>
                  */
                  }
                  <span>
                    {item.area}
                    {' - '}
                    {item.village}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        <div className='map__sidebar__export'>
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
  unselect: PropTypes.func,
  intl: intlShape.isRequired
}

export default injectIntl(DataSelected)
