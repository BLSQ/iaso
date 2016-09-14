import React, {Component, PropTypes} from 'react'
import Vega from 'vega'
import VegaLite from 'vega-lite'

class VegaLiteVis extends Component {
  componentDidMount () {
    this.updateChart()
  }
  componentDidUpdate () {
    this.updateChart()
  }
  updateChart () {
    const {data, spec} = this.props
    if (!data || !spec) {
      return
    }
    const vlConfig = {config: {}}
    const vlData = {data: {values: data}}
    // combine data and visualization config into a VegaLite spec
    const vlSpec = Object.assign(vlData, vlConfig, spec)
    // compile the VegaLite spec to a Vega spec
    const vSpec = VegaLite.compile(vlSpec).spec
    // render the Vega graph from the spec
    Vega.parse.spec(vSpec, (err, chart) => {
      if (err) {
        console.log(err)
        return
      }
      chart({el: this.container, renderer: 'svg'}).update()
    })
  }
  render () {
    return <div ref={(node) => (this.container = node)} />
  }
}

VegaLiteVis.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  spec: PropTypes.object
}

export default VegaLiteVis
