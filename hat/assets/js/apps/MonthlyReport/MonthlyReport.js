import React, { Component } from 'react'
import { push } from 'react-router-redux'

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
          <select name='date' value={date} onChange={this.dateHandler}>
            {dates.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
          <label htmlFor='location'>Location:</label>
          <select name='location' value={location} onChange={this.locationHandler}>
            <option key='all' value=''>All</option>
            {locations.map((date) => (
              <option key={date} value={date}>
                {date}
              </option>
            ))}
          </select>
        </div>
        <div>
          <h2>Results:</h2>
          {error && <div>Error: {error}</div>}
          {loading && <div>Loading...</div>}
          {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
        </div>
      </div>
    )
  }
}
