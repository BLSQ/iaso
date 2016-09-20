import React, { Component } from 'react'

import JsonSchema from './json-schema'
import ResourceList from './resource-list'
import VegaLiteVis from '../../components/vega-lite-vis'
import ValueVis from '../../components/value-vis'
import VISUALIZATIONS from '../../../json/visualizations.json'

function createQueryString (params) {
  return Object.keys(params)
    .map((name) => encodeURIComponent(name) + '=' + encodeURIComponent(params[name]))
    .join('&')
    .replace(/%20/g, '+')
}

export default class Playground extends Component {
  constructor (props) {
    super(props)
    this.state = {
      visName: '',
      datasetConfig: null,
      dataset: null,
      params: null
    }
    this.handleVisSelect = this.handleVisSelect.bind(this)
    this.handleDataSelect = this.handleDataSelect.bind(this)
    this.handleParamsChange = this.handleParamsChange.bind(this)
  }

  handleVisSelect (event) {
    this.setState({visName: event.target.value})
  }

  handleDataSelect (config) {
    this.setState({datasetConfig: config})
    window.fetch(config.url, {headers: {'Accept': 'application/json'}, credentials: 'include'})
      .then((resp) => resp.json())
      .then((json) => {
        this.setState({dataset: json})
      })
  }

  handleParamsChange (params) {
    this.setState({params: params})
    const qs = createQueryString(params)
    const url = this.state.datasetConfig.url + '?' + qs
    window.fetch(url, {headers: {'Accept': 'application/json'}, credentials: 'include'})
      .then((resp) => resp.json())
      .then((json) => {
        this.setState({dataset: json})
      })
  }

  render () {
    const {visName, datasetConfig, dataset} = this.state
    let paramsSchema
    if (datasetConfig && datasetConfig.params_schema) {
      paramsSchema = datasetConfig.params_schema
    }
    let vis
    if (dataset && visName) {
      const visConfig = VISUALIZATIONS[visName]
      switch (visConfig.type) {
        case 'vega-lite': vis = <VegaLiteVis data={dataset} spec={VISUALIZATIONS[visName].spec} />; break
        case 'value': vis = <ValueVis data={dataset} />; break
      }
    }
    return <div>
      <div>
        <label>Visualizations:</label>
        <select value={visName} onChange={this.handleVisSelect}>
          <option key='none' value=''>None</option>
          {Object.keys(VISUALIZATIONS).map((name, i) => {
            return <option key={i} value={name}>{name}</option>
          })}
        </select>
      </div>
      <br />
      <ResourceList title='Datasets' url='/api/datasets' onSelect={this.handleDataSelect} />
      <br />
      <JsonSchema name='Dataset parameters' schema={paramsSchema} onChange={this.handleParamsChange} />
      <hr />
      {vis}
    </div>
  }
}
