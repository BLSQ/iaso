import React, {Component, PropTypes} from 'react'
import {defineMessages, FormattedMessage, injectIntl} from 'react-intl'
import ExportButton from '../../../components/export-button'

const MESSAGES = defineMessages({
  'export-province': {
    id: 'microplanning.export.province',
    defaultMessage: 'Province'
  },
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
    defaultMessage: 'Classification'
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
    defaultMessage: '# Confirmed Cases'
  },
  'export-case-date': {
    id: 'microplanning.export.case.date',
    defaultMessage: 'Last case date'
  },
  'export-screening-people': {
    id: 'microplanning.tooltip.screening.people',
    defaultMessage: '# Screened people'
  },
  'export-screening-date': {
    id: 'microplanning.export.screening.date',
    defaultMessage: 'Last screening date'
  },

  // type values
  official: {
    id: 'microplanning.export.village.type.official',
    defaultMessage: 'from Z.S.'
  },
  other: {
    id: 'microplanning.export.village.type.other',
    defaultMessage: 'not from Z.S.'
  },
  unknown: {
    id: 'microplanning.export.village.type.unknown',
    defaultMessage: 'visible from satellite'
  }
})

const COLUMNS = [
  { message: 'export-province', key: 'province' },
  { message: 'export-zone', key: 'ZS' },
  { message: 'export-area', key: 'AS' },
  { message: 'export-village', key: 'village' },
  { message: 'export-type', key: 'type', type: 'message' },
  { message: 'export-latitude', key: 'latitude', type: 'number' },
  { message: 'export-longitude', key: 'longitude', type: 'number' },
  { message: 'export-population', key: 'population', type: 'number' },
  { message: 'export-cases', key: 'confirmedCases', type: 'number' },
  { message: 'export-case-date', key: 'lastConfirmedCaseDate', type: 'date' },
  { message: 'export-screening-people', key: 'screenedPeople', type: 'number' },
  { message: 'export-screening-date', key: 'lastScreeningDate', type: 'date' }
]

class MapSelectionList extends Component {
  render () {
    const {data, show, deselect} = this.props

    const sectionTitle = (
      <div className='map__selection__title'>
        <FormattedMessage id='microplanning.selected.title' defaultMessage='Village selection' />
      </div>
    )

    if (!data || data.length === 0) {
      const {
        highlightBufferSize,
        highlightBufferSizeChange,
        selectHighlightWithBuffer
      } = this.props

      return (
        <div className='map__selection'>
          <div className='map__selection__content'>
            {sectionTitle}
            <div className='map__selection__summary--empty'>
              <FormattedMessage id='microplanning.selected.empty' defaultMessage='Nothing selected yet' />.
              <span className='text--explanation'>
                <FormattedMessage id='microplanning.selected.empty.explanation' defaultMessage='Start clicking on villages to select them. You can adjust the size of selection buffer zone to include more / fewer villages in your selection' />.
              </span>
            </div>

            <div className='map__selection__actions'>
              <span className='map__text--select'>
                <FormattedMessage id='microplanning.selected.filter.buffer.pre' defaultMessage='Select ALL villages around' />
              </span>
              <input type='number' className='small' min='0' name='buffer-value' value={highlightBufferSize} onChange={highlightBufferSizeChange} />
              <span>
                <FormattedMessage id='microplanning.selected.filter.buffer.post' defaultMessage='km of confirmed cases.' />
              </span>
              <a onClick={selectHighlightWithBuffer} className='button--reduced'>
                <FormattedMessage id='microplanning.selected.filter.select' defaultMessage='Select' />
              </a>
            </div>
          </div>
        </div>
      )
    }

    // calculate number of villages and population
    const number = data.length
    const population = data.reduce((prev, curr) => (prev + (curr.population || 0)), 0)

    return (
      <div className='map__selection'>
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
                defaultMessage='Please note: population estimates may not be accurate.'
              />
              &nbsp;
              <FormattedMessage
                id='microplanning.selected.population.warning1'
                defaultMessage='Only villages from Z.S. have population data.'
              />
              <br />
              <FormattedMessage
                id='microplanning.selected.population.warning2'
                defaultMessage='Population data included in shape files curated by UCLA and based on Villages from Z.S.'
              />
            </div>
          </div>

          <div className='map__selection__list__header'>
            <h3>
              <FormattedMessage id='microplanning.selected.list' defaultMessage='Village list:' />
            </h3>
            <a onClick={() => deselect([])} className='button--tiny button--danger'>
              <FormattedMessage id='microplanning.selected.reset' defaultMessage='Deselect all' />
            </a>
          </div>
          <ul className='map__selection__list'>
            {data.map((item) => {
              return (
                <li className='map__selection__list__item' key={item.id}>
                  <span className='remove' onClick={() => deselect([item])}>
                    <i className='fa fa-close' />
                  </span>
                  <span className={'view text--' + (item.confirmedCases > 0 ? 'highlight' : item.type)} onClick={() => show(item)}>
                    <i className='fa fa-map-marker' />
                  </span>
                  <span>
                    {item.AS}
                    {' - '}
                    {item.village}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        <div className='map__sidebar__export'>
          <ExportButton data={data} columns={COLUMNS} messages={MESSAGES} filename='microplanning' format='xlsx'>
            <FormattedMessage id='microplanning.selected.export' defaultMessage='Export list' />
          </ExportButton>
        </div>
      </div>
    )
  }
}

MapSelectionList.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  show: PropTypes.func,
  deselect: PropTypes.func,
  highlightBufferSize: PropTypes.number,
  highlightBufferSizeChange: PropTypes.func,
  selectHighlightWithBuffer: PropTypes.func
}

export default injectIntl(MapSelectionList)
