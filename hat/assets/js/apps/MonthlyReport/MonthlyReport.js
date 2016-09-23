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

const Row = ({ className, label, value, definition }) => {
  return (
    <li className={className}>
      <span>
        {label}
        {definition && <em className="list__item__definition">* {definition}</em>}
      </span>
      <span>{value}</span>
    </li>
  )
}

export const DataTable = ({ data: { total, screening, confirmation, meta } }) => {
  var daysOut = (new Date(meta.enddate) - new Date(meta.startdate)) / (1000 * 3600 * 24)

  return (

    <div className="widget__container" data-qa='monthly-report-data-loaded'>
      <div className="widget__header">
        <h2 className="widget__heading">Results</h2>
      </div>
      <section>
        <h3 className="list__header block--margin-top--small">Campaign activity</h3>
        <ul className="list--stats">
          <Row className='list__item--stats--important list__item--stats--blue'
            label={<FormattedMessage id='monthlyreport.items.villages_visited' defaultMessage='Number of villages visited' />}
            value={meta.villages_visited} />
          
          <Row className='list__item--stats'
            label={<FormattedMessage id='monthlyreport.items.as_visited' defaultMessage='Number of Aires de Santé visited' />}
            value={meta.az_visited} />

          <Row className='list__item--stats'
            label={<FormattedMessage id='monthlyreport.items.startdate' defaultMessage='Data collection period' />}
            definition={<FormattedMessage id='monthlyreport.items.startdate.definition' defaultMessage='Taken from date of first entry and date of last entry' />}
            value={
              <span>
                <FormattedDate value={new Date(meta.startdate)} />
                &nbsp;&mdash;&nbsp;
                <FormattedDate value={new Date(meta.enddate)} />
              </span>
            } 
            />
        </ul>
      </section>
      
      <section>
        <h3 className="list__header">Case information</h3>
        <ul className="list--stats">
          <Row className='list__item--stats--important list__item--stats--yellow'
            label={<FormattedMessage id='monthlyreport.items.confirmedpositive' defaultMessage='Number of confirmed cases' />}
            definition={<FormattedMessage id='monthlyreport.items.confirmedpositive.definition' defaultMessage='Participants with positive confirmation tests' />}
            value={confirmation.positive} />

          <Row className='list__item--stats'
            label={<FormattedMessage id='monthlyreport.items.confirmednegative' defaultMessage='Participants with negative confirmation tests' />}
            value={confirmation.negative} />

          <Row className='list__item--stats'
            label={<FormattedMessage id='monthlyreport.items.confirmedmissing' defaultMessage='Participants missing confirmation tests' />}
            definition={<FormattedMessage id='monthlyreport.items.confirmedmissing.definition' defaultMessage='Participants with a positive screening test, and without a confirmation test' />}
            value={screening.missing_confirmation} />
        </ul>
      </section>

      <section>
        <h3 className="list__header">Tests</h3>
        <ul className="list--stats">
          <Row className='list__item--stats'
            label={<FormattedMessage id='monthlyreport.items.tested' defaultMessage='Participants with tests' />}
            value={total.tested} />

          <Row className='list__item--stats'
            label={<FormattedMessage id='monthlyreport.items.not_tested' defaultMessage='Participants with no tests' />}
            value={total.registered - total.tested} />

          <Row className='list__item--stats'
            label={<FormattedMessage id='monthlyreport.items.female' defaultMessage='Tested by gender (female)' />}
            value={total.female} />

          <Row className='list__item--stats'
            label={<FormattedMessage id='monthlyreport.items.male' defaultMessage='Tested by gender (male)' />}
            value={total.male} />
        </ul>
      </section>

      <section>
        <h3 className="list__header">Screening tests</h3>
        <ul className="list--stats">
          <Row className='list__item--stats'
            label={<FormattedMessage id='monthlyreport.items.screened' defaultMessage='Participants with screening tests' />}
            value={screening.total} />

          <Row className='list__item--stats'
            label={<FormattedMessage id='monthlyreport.items.suspected' defaultMessage='Participants with positive screening tests' />}
            value={screening.positive} />

          <Row className='list__item--stats'
            label={<FormattedMessage id='monthlyreport.items.daily_screened' defaultMessage='Average number of screening tests per day' />}
            value={Math.round(screening.total / daysOut)} />
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
        <div className="filter__container">
          <h2 className="filter__label">Select:</h2>
          <div className="filter__container__select">
            <label htmlFor='date' className="filter__container__select__label">Month</label>
            <select disabled={loading} name='date' value={date} onChange={this.dateHandler} className="select--minimised">
              {dates.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>
          <div className="filter__container__select">
            <label htmlFor='location' className="filter__container__select__label">Location</label>
            <select disabled={loading} name='location' value={location} onChange={this.locationHandler} className="select--minimised">
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
        </div>
        <div>
          
          {error && <div>Error: {error}</div>}
          {loading && <div>Loading...</div>}
          {data && <DataTable data={data} />}
        </div>
      </div>
    )
  }
}
