/*
 * This component creates and Excel file with the provided list.
 *
 * The `COLUMN` array includes the Excel columns. Every entry indicates the
 * object property to include in that column and the header label.
 *
 * The `MESSAGES` object includes the labels needed. If the column type is `message`
 * the possible column values MUST be included as message entry keys.
 * In our case the key `type` represents the village internal classification,
 * `official`, `other` and `unknown`; with this option those values are changed
 * to user readable/understandable texts.
 */

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
    defaultMessage: 'Zone de sante'
  },
  'export-area': {
    id: 'microplanning.export.area',
    defaultMessage: 'Aire de sante'
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
  'export-case-date': {
    id: 'microplanning.export.case.date',
    defaultMessage: 'Last confirmed HAT case date'
  },
  'export-case-year': {
    id: 'microplanning.export.case.year',
    defaultMessage: 'Last confirmed HAT case year'
  },
  'export-cases': {
    id: 'microplanning.export.cases',
    defaultMessage: 'Confirmed HAT cases in that last year'
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

const COLUMNS = [
  { message: 'export-province', key: 'province' },
  { message: 'export-zone', key: 'ZS' },
  { message: 'export-area', key: 'AS' },
  { message: 'export-village', key: 'village' },
  { message: 'export-type', key: 'type', type: 'message' },
  { message: 'export-latitude', key: 'latitude', type: 'number' },
  { message: 'export-longitude', key: 'longitude', type: 'number' },
  { message: 'export-population', key: 'population', type: 'number' },
  { message: 'export-case-date', key: 'lastConfirmedCaseDate', type: 'date' },
  { message: 'export-case-year', key: 'lastConfirmedCaseYear', type: 'number' },
  { message: 'export-cases', key: 'confirmedCases', type: 'number' }
]

class MapSelectionExport extends Component {
  render () {
    const {data} = this.props

    if (!data || data.length === 0) {
      return <div />
    }

    return (
      <ExportButton
        data={data}
        columns={COLUMNS}
        messages={MESSAGES}
        filename='microplanning'
        format='xlsx'
        className='button--export'>
        <FormattedMessage id='microplanning.selected.export' defaultMessage='Export list' />
      </ExportButton>
    )
  }
}

MapSelectionExport.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object)
}

export default injectIntl(MapSelectionExport)
