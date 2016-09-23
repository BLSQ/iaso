import React, { Component } from 'react'
import { push } from 'react-router-redux'
import { FormattedMessage, FormattedDate } from 'react-intl'

function createUrl ({date, source, location}) {
  let url = '/charts'
  if (location) {
    url = `${url}/location/${location}`
  }

  if (source) {
    url = `${url}/source/${source}`
  }

  if (date) {
    url = `${url}/date/${date}`
  }

  return url
}

const Row = ({ className, label, value }) => {
  return (
    <li className={className}>
      <div>{label}</div>
      <div>{value}</div>
    </li>
  )
}

export const DataTable = ({ data: { total, screening, confirmation, meta } }) => {
  var daysOut = (new Date(meta.enddate) - new Date(meta.startdate)) / (1000 * 3600 * 24)

  return (
    <div data-qa='monthly-report-data-loaded'>
      <section>
        <h3>Campaign</h3>
        <ul>
          <Row className='example_class'
            label={<FormattedMessage id='monthlyreport.items.startdate' defaultMessage='First Entry Date' />}
            value={<FormattedDate value={new Date(meta.startdate)} />} />

          <Row className='example_class'
            label={<FormattedMessage id='monthlyreport.items.enddate' defaultMessage='Last Entry Date' />}
            value={<FormattedDate value={new Date(meta.enddate)} />} />

          <Row className='example_class'
            label={<FormattedMessage id='monthlyreport.items.as_visited' defaultMessage='Aire de Santé (AS) Visited' />}
            value={meta.az_visited} />

          <Row className='example_class'
            label={<FormattedMessage id='monthlyreport.items.villages_visited' defaultMessage='Villages Visited' />}
            value={meta.villages_visited} />
        </ul>
      </section>

      <section>
        <h3>Tests</h3>
        <ul>
          <Row className='example_class'
            label={<FormattedMessage id='monthlyreport.items.tested' defaultMessage='Participants With Tests' />}
            value={total.tested} />

          <Row className='example_class'
            label={<FormattedMessage id='monthlyreport.items.not_tested' defaultMessage='Participants With No Tests' />}
            value={total.registered - total.tested} />

          <Row className='example_class'
            label={<FormattedMessage id='monthlyreport.items.female' defaultMessage='Tested by Gender (female)' />}
            value={total.female} />

          <Row className='example_class'
            label={<FormattedMessage id='monthlyreport.items.male' defaultMessage='Tested by Gender (male)' />}
            value={total.male} />
        </ul>
      </section>

      <section>
        <h3>Screening</h3>
        <ul>
          <Row className='example_class'
            label={<FormattedMessage id='monthlyreport.items.screened' defaultMessage='Participants with Screening Tests' />}
            value={screening.total} />

          <Row className='example_class'
            label={<FormattedMessage id='monthlyreport.items.suspected' defaultMessage='Participants With Positive Screening Tests' />}
            value={screening.positive} />

          <Row className='example_class'
            label={<FormattedMessage id='monthlyreport.items.daily_screened' defaultMessage='Avg. number of screenings per day' />}
            value={Math.round(screening.total / daysOut)} />
        </ul>
      </section>

      <section>
        <h3>Confirmation</h3>
        <ul>
          <Row className='example_class'
            label={<FormattedMessage id='monthlyreport.items.confirmedpositive' defaultMessage='Participants with Positive Confirmation Tests' />}
            value={confirmation.positive} />

          <Row className='example_class'
            label={<FormattedMessage id='monthlyreport.items.confirmednegative' defaultMessage='Participants With Negative Confirmation Tests' />}
            value={confirmation.negative} />

          <Row className='example_class'
            label={<FormattedMessage id='monthlyreport.items.confirmedmissing' defaultMessage='Participants Positive Screening Tests Missing Confirmation Tests' />}
            value={screening.missing_confirmation} />
        </ul>
      </section>
    </div>
  )
}

export default class MonthlyReport extends Component {
  constructor () {
    super()
    this.dateHandler = this.dateHandler.bind(this)
    this.locationHandler = this.locationHandler.bind(this)
  }

  dateHandler (event) {
    let date = event.target.value
    let url = createUrl({...this.props.params, date})
    this.props.dispatch(push(url))
  }

  locationHandler (event) {
    let location = event.target.value
    let url = createUrl({...this.props.params, location})
    this.props.dispatch(push(url))
  }

  render () {
    // source, sources also available
    let { date, location } = this.props.params
    let { dates, locations } = this.props.config
    let { loading, data, error } = this.props.report

    return (
      <div>
        <div>
          <h2>Filters:</h2>
          <label htmlFor='date'>Month:</label>
          <select disabled={loading} name='date' value={date} onChange={this.dateHandler}>
            {dates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
          <label htmlFor='location'>Location:</label>
          <select disabled={loading} name='location' value={location} onChange={this.locationHandler}>
            <option key='all' value=''>
              <FormattedMessage
                id='monthlyreport.labels.national'
                defaultMessage='National' />
            </option>
            {locations.map((loc) => {
              var val = `${loc.ZS}`
              return (
                <option key={val} value={val}>
                  {val}
                </option>
              )
            })}
          </select>
        </div>
        <div>
          <h2>Results:</h2>
          {error && <div>Error: {error}</div>}
          {loading && <div>Loading...</div>}
          {data && <DataTable data={data} />}
        </div>
      </div>
    )
  }
}
