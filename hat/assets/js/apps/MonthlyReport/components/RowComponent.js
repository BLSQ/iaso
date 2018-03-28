import React, { Component } from 'react';
import PropTypes from 'prop-types';

class DataTableComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    render() {
        const {
            className,
            label,
            value,
            definition,
            html,
        } = this.props;
        return (
            <li className={className}>
                <span>
                    {label}
                    {definition && <em className="list__item__definition">* {definition}</em>}
                </span>
                <span>
                    <span className="list__item__number">
                        {value}
                        {html}
                    </span>
                </span>
            </li>
        );
    }
}
DataTableComponent.defaultProps = {
    className: '',
    label: null,
    value: '',
    definition: null,
    html: null,
};

DataTableComponent.propTypes = {
    className: PropTypes.string,
    label: PropTypes.object,
    value: PropTypes.string,
    definition: PropTypes.object,
    html: PropTypes.object,
};


export default DataTableComponent;
