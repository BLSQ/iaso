import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import moment from 'moment';
import {
    FormattedMessage,
    injectIntl,
} from 'react-intl';

import { NormalizeBarChartDatas, getBarChartMax, formatThousand } from '../utils';

class BarChart extends Component {
    componentDidMount() {
        this.updateChart();
    }
    componentDidUpdate() {
        this.updateChart();
    }

    updateChart() {
        if (this.container.hasChildNodes()) {
            this.container.removeChild(this.container.childNodes[0]);
        }
        const {
            datas,
            settings,
            specs,
        } = this.props;

        const width = specs.width - specs.margin.left - specs.margin.right;
        const height = specs.height - specs.margin.top - specs.margin.bottom;
        const x = d3.scaleBand().rangeRound([0, width]).padding(0.1);
        const y = d3.scaleLinear().rangeRound([height, 0]);

        const svg = d3.select(this.container)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${specs.width} ${specs.height}`)
            .attr('preserveAspectRatio', 'xMinYMin');


        const g = svg.append('g')
            .attr('transform', `translate(${specs.margin.left},${specs.margin.top})`);


        x.domain(datas.map(d => d.date));
        y.domain([0, d3.max(datas, d => getBarChartMax(settings, d))]);

        const barWidth = x.bandwidth() / settings.length;

        g.append('g')
            .attr('class', 'axis axis--x')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x)
                .tickFormat(value => moment(value).format('MMM YYYY')));

        g.append('g')
            .attr('class', 'axis axis--y')
            .call(d3.axisLeft(y)
                .ticks(5));


        const periodContainer = g.selectAll('.bar')
            .data(datas)
            .enter()
            .append('g')
            .attr('transform', d => `translate(${x(d.date)},0)`);

        periodContainer
            .append('text')
            .attr('class', 'period-label')
            .attr('transform', () => `translate(${x.bandwidth() / 2}, -30)`)
            .text(d => moment(d.date).format('MMM YYYY'));

        periodContainer
            .append('line')
            .attr('class', 'period-line')
            .attr('x1', 0)
            .attr('y1', -50)
            .attr('x2', 0)
            .attr('y2', height);

        periodContainer
            .append('line')
            .attr('class', 'period-line')
            .attr('x1', x.bandwidth() + 2)
            .attr('y1', -50)
            .attr('x2', x.bandwidth() + 2)
            .attr('y2', height);

        const tooltipContainer = svg
            .append('g')
            .attr('class', 'tooltip-container');

        tooltipContainer
            .attr('class', 'tooltip-container-bg')
            .append('rect')
            .attr('rx', '5')
            .attr('ry', '5')
            .attr('width', '30')
            .attr('height', '15');

        const tooltip = tooltipContainer
            .append('text')
            .attr('class', 'tooltip')
            .attr('transform', 'translate(15, 11)');

        const rectContainer = periodContainer
            .selectAll('rect')
            .data(d => NormalizeBarChartDatas(settings, d))
            .enter();

        rectContainer.append('rect')
            .attr('class', d => `${d.key} bar`)
            .attr('width', (barWidth))
            .attr('y', d => y(d.value))
            .attr('fill', d => d.color)
            .attr('transform', (d) => {
                let yPos = 0;
                if (d.previousValue > 0) {
                    yPos = -(height - y(d.previousValue));
                }
                return `translate(${(((barWidth)) * d.index) + 1}, ${yPos})`;
            })
            .attr('height', d => height - y(d.value))
            .on('mousemove', (d) => {
                const coords = d3.mouse(d3.event.currentTarget);
                let yPos = coords[1];
                if (d.previousValue > 0) {
                    yPos = coords[1] - (height - y(d.previousValue));
                }
                tooltipContainer
                    .attr('transform', `translate(${(coords[0] + x(d.original.date) + (((barWidth)) * d.index) + specs.margin.left) - 17}, ${yPos - 2})`);
            })
            .on('mouseover', (d) => {
                tooltipContainer.style('display', 'block');
                tooltip.text(formatThousand(d.value));
            })
            .on('mouseout', () => {
                tooltipContainer.style('display', 'none');
            });

        rectContainer
            .append('text')
            .attr('class', d => `bar-label ${d.key}`)
            .attr('width', (barWidth))
            .attr('transform', (d) => {
                const xPos = (((barWidth)) * d.index) + (barWidth / 2);
                let yPos = y(d.value) - 5;
                if (d.previousValue > 0) {
                    yPos = y(d.previousValue) - (height - y(d.value)) - 5;
                }
                return `translate(${xPos}, ${yPos})`;
            })
            .text(d => d.label);
    }

    render() {
        const {
            settings,
            showLegend,
            extraComponent,
        } = this.props;
        return (
            <section>
                <div className="widget__header">
                    <h2 className="widget__heading">
                        {this.props.title}
                    </h2>
                </div>
                <div className="widget__content bar-chart-container">
                    <div
                        ref={(node) => { this.container = node; }}
                        className={`bar-chart${!showLegend ? ' full' : ''}`}
                    />
                    <div className="legend-container">
                        {
                            extraComponent &&
                            <div className="extra">
                                {extraComponent}
                            </div>
                        }
                        {showLegend &&
                            <ul className="legend">
                                {
                                    settings.map((s) => {
                                        if (s.datas) {
                                            return s.datas.map((sub) => {
                                                const messageProps = {
                                                    id: sub.id,
                                                    defaultMessage: sub.defaultMessage,
                                                };
                                                return (
                                                    <li className="legend__item" key={sub.id}>
                                                        <span className="legend__color" style={{ backgroundColor: sub.color }} />
                                                        <span>{sub.label !== '' ? `${sub.label} - ` : ''}<FormattedMessage {...messageProps} /></span>
                                                    </li>
                                                );
                                            });
                                        }
                                        const messageProps = {
                                            id: s.id,
                                            defaultMessage: s.defaultMessage,
                                        };
                                        return (
                                            <li className="legend__item" key={s.id}>
                                                <span className="legend__color" style={{ backgroundColor: s.color }} />
                                                <span>{s.label !== '' ? `${s.label} - ` : ''}<FormattedMessage {...messageProps} /></span>
                                            </li>
                                        );
                                    })
                                }
                            </ul>
                        }
                    </div>
                </div>
            </section>
        );
    }
}
BarChart.defaultProps = {
    showLegend: false,
    title: '',
    specs: {
        width: 1000,
        height: 450,
        margin: {
            top: 20, right: 20, bottom: 30, left: 40,
        },
    },
    extraComponent: null,
};

BarChart.propTypes = {
    showLegend: PropTypes.bool,
    title: PropTypes.string,
    datas: PropTypes.array.isRequired,
    settings: PropTypes.array.isRequired,
    specs: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number,
        margin: PropTypes.object,
    }),
    extraComponent: PropTypes.object,
};

const BarChartIntl = injectIntl(BarChart);
export default BarChartIntl;

