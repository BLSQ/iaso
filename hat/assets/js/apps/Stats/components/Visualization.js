import React, { Component } from 'react';
import PropTypes from 'prop-types';
import MG from 'metrics-graphics';

class Visualization extends Component {
    componentDidMount() {
        this.updateChart();
    }
    componentDidUpdate() {
        this.updateChart();
    }
    updateChart() {
        const data = this.props.data || [];
        const spec = this.props.spec || {};
        const chartData = MG.convert.date(JSON.parse(JSON.stringify(data)), 'date');
        MG.data_graphic({
            area: false,
            data: chartData,
            full_width: true,
            height: 200,
            target: this.container,
            // Transitions can easily kill the browser with lots of data points. So we disable them
            transition_on_update: false,
            ...spec,
        });
    }
    render() {
        return <div ref={(node) => { this.container = node; }} />;
    }
}

Visualization.propTypes = {
    data: PropTypes.array.isRequired,
    spec: PropTypes.object.isRequired,
};

export default Visualization;
