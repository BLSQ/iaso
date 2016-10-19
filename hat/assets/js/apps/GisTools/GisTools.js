import React, { Component } from 'react'
import { connect } from 'react-redux'
import { push } from 'react-router-redux'
import {
  FormattedMessage,
  FormattedDate,
  injectIntl,
  defineMessages
} from 'react-intl'
import { createUrl } from '../../utils/fetchData'
import MapVis from '../../components/map-vis'

const MESSAGES = defineMessages({
  // colum headers
  'column-zs': {
    id: 'gistools.table.column.zs',
    defaultMessage: 'Zone de Sante'
  },
  'column-az': {
    id: 'gistools.table.column.az',
    defaultMessage: 'Aire de Sante'
  },
  'column-village': {
    id: 'gistools.table.column.village',
    defaultMessage: 'Village'
  },
  'column-cases': {
    id: 'gistools.table.column.cases',
    defaultMessage: '# Cases'
  },
  'column-date': {
    id: 'gistools.table.column.date',
    defaultMessage: 'Last case date'
  },

  // dateperiod messages
  'since-last-year': {
    defaultMessage: 'Since last year',
    id: 'gistools.dateperiod.since-last-year'
  },
  'since-three-years': {
    defaultMessage: 'Since three years',
    id: 'gistools.dateperiod.since-three-years'
  },
  'since-five-years': {
    defaultMessage: 'Since five years',
    id: 'gistools.dateperiod.since-five-years'
  },

  // misc
  'location-national': {
    defaultMessage: 'National',
    id: 'gistools.labels.national'
  }
})

const TABLE_COLUMNS = [
  {message: 'column-zs', key: 'ZS'},
  {message: 'column-az', key: 'AZ'},
  {message: 'column-village', key: 'village'},
  {message: 'column-cases', key: 'confirmed_cases', type: 'number'},
  {message: 'column-date', key: 'last_confirmed_date', type: 'date'}
]

const mapConfirmed = (item) => ({
  zone: item.ZS,
  area: item.AZ,
  village: item.village,
  cases: item.confirmed_cases,
  date: item.last_confirmed_date
})

export const DataTable = ({
  data: {
    confirmedByLocation,
    location
  }
}) => {
  return (
    <section className='widget__content'>
      <h3 className='block--margin-bottom--xxs'>
        <FormattedMessage id='gistools.header.confirmed_cases' defaultMessage='List of villages with confirmed cases' />
      </h3>

      <table className='table--minimised'>
        <thead>
          <tr>
            {
              TABLE_COLUMNS.map((col) => {
                return <th key={col.message}><FormattedMessage {...MESSAGES[col.message]} /></th>
              })
            }
          </tr>
        </thead>
        <tbody>
          {
            confirmedByLocation.map((row) => {
              return <tr key={row.village}>
                {
                  TABLE_COLUMNS.map((col) => {
                    const val = row[col.key]
                    switch (col.type) {
                      case 'date':
                        return <td key={col.message}><FormattedDate value={val} /></td>
                      default:
                        return <td key={col.message}>{val}</td>
                    }
                  })
                }
              </tr>
            })
          }
        </tbody>
      </table>
    </section>
  )
}

const DATEPERIODS = [
  'since-last-year',
  'since-three-years',
  'since-five-years'
]

export class GisTools extends Component {
  constructor () {
    super()
    this.dateHandler = this.dateHandler.bind(this)
    this.locationHandler = this.locationHandler.bind(this)
  }

  dateHandler (event) {
    const dateperiod = event.target.value
    // Reset offset when changing date/time
    const url = createUrl({...this.props.params, dateperiod, offset: null})
    this.props.dispatch(push(url))
  }

  locationHandler (event) {
    const location = event.target.value
    // Reset offset when changing date/time
    const url = createUrl({...this.props.params, location, offset: null})
    this.props.dispatch(push(url))
  }

  render () {
    const {formatMessage} = this.props.intl
    // source, sources also available
    const { dateperiod, location } = this.props.params
    const { data, error } = this.props.geoData
    const locations = data && data.locations || []
    const loading = this.props.geoData.loading
    const numResults = data && data.confirmedByLocation && data.confirmedByLocation.length || 0
    const points = (numResults > 0) ? data.confirmedByLocation.map(mapConfirmed) : []

    // Used in integration test to check loading + rendering
    const qaStatus = (data && !loading && !error) ? 'gis-tools-data-loaded' : 'gis-tools-loading'

    return (
      <div data-qa={qaStatus}>
        <div className='filter__container'>
          <h2 className='filter__label'>Select:</h2>
          <div className='filter__container__select'>
            <label htmlFor='date' className='filter__container__select__label'><i className='fa fa-calendar' /> Timeframe</label>
            <select disabled={loading} name='date' value={dateperiod} onChange={this.dateHandler} className='select--minimised'>
              {DATEPERIODS.map((period) => (
                <option key={period} value={period}>
                  {formatMessage(MESSAGES[period])}
                </option>
              ))}
            </select>
          </div>
          <div className='filter__container__select'>
            <label htmlFor='location' className='filter__container__select__label'><i className='fa fa-globe' /> Location</label>
            <select disabled={loading} name='location' value={location || ''} onChange={this.locationHandler} className='select--minimised'>
              <option key='all' value=''>
                {formatMessage(MESSAGES['location-national'])}
              </option>
              {locations.map((loc) => {
                var val = loc.ZS
                return <option key={val} value={val}>{val}</option>
              })}
            </select>
          </div>
        </div>
        <div>
          {
            error && <div className='widget__container'>
              <div className='widget__header'>
                <h2 className='widget__heading text--error'>Error:</h2>
              </div>
              <div className='widget__content'>
                {error}
              </div>
            </div>
          }
        </div>
        <div className='widget__container'>
          <div className='widget__header'>
            <h2 className='widget__heading'>
              <FormattedMessage id='gistools.header.map' defaultMessage='Map' />
            </h2>
          </div>
          <div className='widget__content list__item--map' data-qa='gis-tools-data-loaded'>
            <MapVis data={points} />
          </div>
          <div className='widget__header'>
            <h2 className='widget__heading'>
              {numResults} <FormattedMessage id='gistools.header.results' defaultMessage='villages with confirmed cases for this period' />
            </h2>
          </div>
          <span>
            {
              data && <DataTable data={data} />
            }
          </span>
        </div>
      </div>
    )
  }
}

const GisToolsWithIntl = injectIntl(GisTools)

export default connect((state, ownProps) => ({
  config: state.config,
  geoData: state.geoData
}))(GisToolsWithIntl)
