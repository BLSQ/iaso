import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import { injectIntl } from 'react-intl';

let height;
let g;
let x;
let y;

class HomeBarChart extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isChartDrawed: false,
        };
    }
    componentDidMount() {
        this.drawBaseChart();
        this.spyScroll(this.container);
        document.addEventListener('scroll', () => this.spyScroll(), false);
    }

    spyScroll() {
        const graphTopPosition = this.container.getBoundingClientRect().top;
        if (graphTopPosition < window.innerHeight * 0.70 && !this.state.isChartDrawed) {
            this.setState({
                isChartDrawed: true,
            });
            this.updateChart();
        }
    }

    drawBaseChart() {
        if (this.container.hasChildNodes()) {
            this.container.removeChild(this.container.childNodes[0]);
        }
        const {
            datas,
            specs,
        } = this.props;

        const width = specs.width - specs.margin.left - specs.margin.right;
        height = specs.height - specs.margin.top - specs.margin.bottom;
        x = d3.scaleBand().rangeRound([0, width]).padding(0.2);
        y = d3.scaleLinear().rangeRound([height, 0]);

        const svg = d3.select(this.container)
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${specs.width} ${specs.height}`)
            .attr('preserveAspectRatio', 'xMinYMin');


        g = svg.append('g')
            .attr('transform', `translate(${specs.margin.left},${specs.margin.top})`);


        x.domain(datas.map(d => d.date));
        y.domain([0, d3.max(datas, d => d.value)]);
        g.append('g')
            .attr('class', 'axis axis--x')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x));

        g.append('g')
            .attr('class', 'axis axis--y')
            .call(d3.axisLeft(y)
                .ticks(5));
    }

    updateChart() {
        const {
            datas,
        } = this.props;
        g.selectAll('.bar')
            .data(datas)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('fill', '#122272')
            .attr('y', height)
            .attr('x', d => x(d.date))
            .attr('width', x.bandwidth())
            .transition()
            .duration(750)
            .delay((d, i) => i * 20)
            .attr('y', d => y(d.value))
            .attr('height', d => height - y(d.value));
    }

    render() {
        return (
            <section>
                <h2>
                    {this.props.title}
                </h2>
                <div className="bar-chart-container" id="home-bar-chart">
                    <div
                        ref={(node) => { this.container = node; }}
                        className="bar-chart full"
                    />
                </div>
            </section>
        );
    }
}
HomeBarChart.defaultProps = {
    title: '',
    specs: {
        width: 1200,
        height: 450,
        margin: {
            top: 20, right: 20, bottom: 30, left: 40,
        },
    },
};

HomeBarChart.propTypes = {
    title: PropTypes.string,
    datas: PropTypes.array.isRequired,
    specs: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number,
        margin: PropTypes.object,
    }),
};

const BarChartIntl = injectIntl(HomeBarChart);
export default BarChartIntl;

