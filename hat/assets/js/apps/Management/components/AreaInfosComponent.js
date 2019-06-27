
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { deepEqual } from '../../../utils';
import ArrayFieldInput from '../../../components/ArrayFieldInput';

class AreaInfosComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            area: props.area,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (!deepEqual(nextProps.area, this.props.area, true)) {
            this.setState({
                area: nextProps.area,
            });
        }
    }

    render() {
        const {
            updateAreaField,
        } = this.props;
        const { area } = this.state;
        return (
            <section className="half-container" >
                <div />
                <div >
                    <div>
                        <label
                            htmlFor={`name-${area.id}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.name"
                                defaultMessage="Nom"
                            />:
                        </label>
                        <input
                            type="text"
                            name="name"
                            id={`name-${area.id}`}
                            className={(!area.name || area.name === '') ? 'form-error' : ''}
                            value={area.name}
                            onChange={event => updateAreaField('name', event.currentTarget.value)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={`aliases-${area.id}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.aliases"
                                defaultMessage="Alias"
                            />:
                        </label>
                        <ArrayFieldInput
                            fieldList={area.aliases}
                            name={`aliases-${area.id}`}
                            baseId={`alias-${area.id}`}
                            updateList={list => updateAreaField('aliases', list)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={`source-${area.id}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.source"
                                defaultMessage="Source du village"
                            />:
                        </label>
                        <input
                            type="text"
                            name="source"
                            id={`source-${area.id}`}
                            value={area.source}
                            onChange={event => updateAreaField('source', event.currentTarget.value)}
                        />
                    </div>
                </div>
            </section>
        );
    }
}

AreaInfosComponent.propTypes = {
    area: PropTypes.object.isRequired,
    updateAreaField: PropTypes.func.isRequired,
};

export default AreaInfosComponent;
