
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { deepEqual } from '../../../utils';
import ArrayFieldInput from '../../../components/ArrayFieldInput';

class ZoneInfosComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            zone: props.zone,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (!deepEqual(nextProps.zone, this.props.zone, true)) {
            this.setState({
                zone: nextProps.zone,
            });
        }
    }

    render() {
        const {
            updateZoneField,
        } = this.props;
        const { zone } = this.state;
        return (
            <div >
                <div>
                    <label
                        htmlFor={`name-${zone.id}`}
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
                        id={`name-${zone.id}`}
                        className={(!zone.name || zone.name === '') ? 'form-error' : ''}
                        value={zone.name}
                        onChange={event => updateZoneField('name', event.currentTarget.value)}
                    />
                </div>
                <div className="display-flex">
                    <label
                        htmlFor={`aliases-${zone.id}`}
                        className="filter__container__select__label"
                    >
                        <FormattedMessage
                            id="main.label.aliases"
                            defaultMessage="Alias"
                        />:
                    </label>
                    <ArrayFieldInput
                        fieldList={zone.aliases}
                        name={`aliases-${zone.id}`}
                        baseId={`alias-${zone.id}`}
                        updateList={list => updateZoneField('aliases', list)}
                    />
                </div>
                <div>
                    <label
                        htmlFor={`source-${zone.id}`}
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
                        id={`source-${zone.id}`}
                        value={zone.source}
                        onChange={event => updateZoneField('source', event.currentTarget.value)}
                    />
                </div>
            </div>
        );
    }
}

ZoneInfosComponent.propTypes = {
    zone: PropTypes.object.isRequired,
    updateZoneField: PropTypes.func.isRequired,
};

export default ZoneInfosComponent;
