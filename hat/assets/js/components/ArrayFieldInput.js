import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
    addPositionIndex,
    removePositionIndex,
} from '../utils';

class ArrayFieldInput extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fieldList: addPositionIndex(props.fieldList),
        };
    }

    componentWillReceiveProps(newProps) {
        this.setState({
            fieldList: addPositionIndex(newProps.fieldList),
        });
    }

    updateField(value, fieldIndex) {
        const newFieldList = this.state.fieldList.slice();
        newFieldList[fieldIndex].value = value;
        this.props.updateList(removePositionIndex(newFieldList));
    }

    addField() {
        const newFieldList = this.state.fieldList.slice();
        newFieldList.push({
            value: '',
            position: this.state.fieldList.length,
        });
        this.props.updateList(removePositionIndex(newFieldList));
    }

    removeField(fieldIndex) {
        const newFieldList = this.state.fieldList.slice();
        newFieldList.splice(fieldIndex, 1);
        this.props.updateList(removePositionIndex(newFieldList));
    }

    render() {
        const {
            baseId,
            name,
        } = this.props;
        const {
            fieldList,
        } = this.state;
        const addFieldButtonDisabled = fieldList.length > 0 && fieldList[fieldList.length - 1].value === '';
        return (
            <div className="array-field-container">
                {
                    fieldList.map((a, fieldIndex) => (
                        <span key={a.position}>
                            <input
                                type="text"
                                name={name}
                                id={`${baseId}-${a.position}`}
                                value={a.value}
                                onChange={event => this.updateField(event.currentTarget.value, fieldIndex)}
                            />
                            <span className="align-right remove-button">
                                <button
                                    className="button--danger button--tiny"
                                    onClick={() => this.removeField(fieldIndex)}
                                >
                                    <i className="fa fa-trash" />
                                </button>
                            </span>
                        </span>
                    ))
                }
                <div className="align-right">
                    <button
                        disabled={addFieldButtonDisabled}
                        className="button--tiny"
                        onClick={() => this.addField()}
                    >
                        <i className="fa fa-plus" />
                    </button>
                </div>
            </div>
        );
    }
}
ArrayFieldInput.defaultProps = {
    fieldList: [],
};

ArrayFieldInput.propTypes = {
    fieldList: PropTypes.array,
    baseId: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    updateList: PropTypes.func.isRequired,
};

export default ArrayFieldInput;
