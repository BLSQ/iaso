import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';

class Donut extends Component {
    componentDidMount() {
        this.updateDonut();
    }
    componentDidUpdate() {
        this.updateDonut();
    }

    updateDonut() {
        // remove the old old donut and then add a new one
        if (this.container.hasChildNodes()) {
            this.container.removeChild(this.container.childNodes[0]);
        }
        const value = this.props.value || 0;
        const width = 600;
        const height = 300;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const radius = Math.min(width, height) / 2;

        const arc = d3.arc()
            .outerRadius(radius - 20)
            .innerRadius(radius - 60);

        const svg = d3.select(this.container)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .attr('preserveAspectRatio', 'xMinYMin')
            .append('g')
            .attr('transform', `translate(${halfWidth},${halfHeight})`);

        const pie = d3.pie()
            .sort(null);

        const g = svg.selectAll('.arc')
            .data(pie([1 - value, value]))
            .enter()
            .append('g')
            .attr('class', 'arc');

        const colors = ['rgb(216, 216, 216)', 'rgb(242, 208, 51)'];

        g.append('path')
            .attr('d', arc)
            .style('fill', d => colors[d.index]);
    }
    render() {
        const v = this.props.value || 0;
        const p = Math.round(v * 10000) / 100;
        return (
            <div className="donut">
                <span className="donut--number">{p}%</span>
                <div ref={(node) => { this.container = node; }} />
            </div>
        );
    }
}

Donut.propTypes = {
    value: PropTypes.number.isRequired,
};

export default Donut;

