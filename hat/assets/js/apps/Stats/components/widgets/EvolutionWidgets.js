import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { curveLinear } from 'd3';
import Visualization from '../Visualization';

class UnmatchCasesWidgets extends Component {
    render() {
        const { data } = this.props;
        const spec = {
            x_accessor: 'date',
            y_accessor: 'value',
            right: 40,
            top: 20,
            height: 300,
            interpolate: curveLinear,
        };
        return (
            <div className="widget__container">
                <div className="widget__header">
                    <h2 className="widget__heading">
                        {this.props.title}
                    </h2>
                </div>
                <div className="widget__content">
                    <section className="wrapper__column">
                        <div className="container__graph responsive">
                            <Visualization data={data} spec={spec} convert="custom" />
                        </div>
                    </section>
                </div>
            </div>);
    }
}

UnmatchCasesWidgets.propTypes = {
    data: PropTypes.array.isRequired,
    title: PropTypes.string.isRequired,
};

export default UnmatchCasesWidgets;
