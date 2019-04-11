import React, { Component } from 'react';
import { curveLinear } from 'd3';
import PropTypes from 'prop-types';
import MG from 'metrics-graphics';


const customConvertDates = (list) => {
    const tempList = [];
    list.map((el) => {
        const tempEl = {
            ...el,
            date: new Date(el.timestamp),
        };
        tempList.push(tempEl);
        return true;
    });
    return tempList;
};

class Visualization extends Component {
    componentDidMount() {
        this.updateChart();
    }
    componentDidUpdate() {
        this.updateChart();
    }
    updateChart() {
        let data = this.props.data || [];
        const spec = this.props.spec || {};
        if (this.props.convert === 'custom') {
            data = customConvertDates(data);
        } else {
            data = MG.convert.date(JSON.parse(JSON.stringify(data)), 'date');
        }
        MG.data_graphic({
            area: false,
            data,
            full_width: true,
            height: 200,
            target: this.container,
            interpolate: curveLinear,
            // Transitions can easily kill the browser with lots of data points. So we disable them
            transition_on_update: false,
            ...spec,
        });
    }
    render() {
        return <div ref={(node) => { this.container = node; }} />;
    }
}
Visualization.defaultProps = {
    convert: '',
};

Visualization.propTypes = {
    data: PropTypes.array.isRequired,
    spec: PropTypes.object.isRequired,
    convert: PropTypes.string,
};

export default Visualization;
