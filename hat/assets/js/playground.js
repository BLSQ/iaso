import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { Route, useRouterHistory } from 'react-router'
import { createHistory } from 'history'

import createStore from './redux/createStore'
import App from './apps/App'

import JsonSchema from './apps/playground/json-schema'
import ResourceList from './apps/playground/resource-list'
import VegaLiteVis from './components/vega-lite-vis'
import ValueVis from './components/value-vis'

function createQueryString (params) {
  return Object.keys(params)
    .map((name) => encodeURIComponent(name) + '=' + encodeURIComponent(params[name]))
    .join('&')
    .replace(/%20/g, '+')
}

class Playground extends Component {
  constructor (props) {
    super(props)
    this.state = {
      visConfig: null,
      datasetConfig: null,
      dataset: null,
      params: null
    }
    this.handleVisSelect = this.handleVisSelect.bind(this)
    this.handleDataSelect = this.handleDataSelect.bind(this)
    this.handleParamsChange = this.handleParamsChange.bind(this)
  }

  handleVisSelect (config) {
    window.fetch(config.url, {headers: {'Accept': 'application/json'}, credentials: 'include'})
      .then((resp) => resp.json())
      .then((json) => {
        this.setState({visConfig: json})
      })
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
    const {visConfig, datasetConfig, dataset} = this.state
    let paramsSchema
    if (datasetConfig && datasetConfig.params_schema) {
      paramsSchema = datasetConfig.params_schema
    }
    let vis
    if (dataset && visConfig) {
      switch (visConfig.type) {
        case 'vega-lite': vis = <VegaLiteVis data={dataset} spec={visConfig.spec} />; break
        case 'value': vis = <ValueVis data={dataset} />; break
      }
    }
    return <div>
      <ResourceList title='Visualizations' url='/api/visualizations' onSelect={this.handleVisSelect} />
      <br />
      <ResourceList title='Datasets' url='/api/datasets' onSelect={this.handleDataSelect} />
      <br />
      <JsonSchema name='Dataset parameters' schema={paramsSchema} onChange={this.handleParamsChange} />
      <hr />
      {vis}
    </div>
  }
}

const routes = [
  <Route path='/' component={Playground} />
]

const store = createStore()
const history = useRouterHistory(createHistory)({
  // This is the base url, the one we define
  // in hat.dashboard.urls
  // TODO: How to read this from Django?
  basename: '/playground/'
})

ReactDOM.render(<App store={store} routes={routes} history={history} />, document.getElementById('app'))
