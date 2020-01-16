
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Select from 'react-select';

import { deepEqual } from '../../../utils';
import ArrayFieldInput from '../../../components/ArrayFieldInput';
import { getGeoList } from './AreaInfosComponent';

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
            geoProvinces,
            intl: {
                formatMessage,
            },
        } = this.props;
        const { zone } = this.state;
        return (
            <div>
                <div>
                    <label
                        htmlFor={`name-${zone.id}`}
                        className="filter__container__select__label"
                    >
                        <FormattedMessage
                            id="main.label.name"
                            defaultMessage="Nom"
                        />
:
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
                        />
:
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
                        />
:
                    </label>
                    <input
                        type="text"
                        name="source"
                        id={`source-${zone.id}`}
                        className={(!zone.source || zone.source === '') ? 'form-error' : ''}
                        value={zone.source || ''}
                        onChange={event => updateZoneField('source', event.currentTarget.value)}
                    />
                </div>
                <div>
                    <label
                        htmlFor={`province-${zone.id}`}
                        className="filter__container__select__label"
                    >
                        <FormattedMessage
                            id="main.label.province"
                            defaultMessage="Province"
                        />
                        :
                    </label>
                    <Select
                        className={!zone.province_id ? 'form-error' : null}
                        multi={false}
                        clearable={false}
                        simpleValue
                        name={`province-${zone.id}`}
                        value={zone.province_id}
                        placeholder={formatMessage({
                            id: 'main.label.provinceSelect',
                            defaultMessage: 'Select one province',
                        })}
                        options={getGeoList(geoProvinces).map(p => (
                            {
                                label: p.name,
                                value: p.id,
                            }
                        ))}
                        onChange={value => updateZoneField('province_id', value)}
                    />
                </div>
            </div>
        );
    }
}

ZoneInfosComponent.propTypes = {
    zone: PropTypes.object.isRequired,
    updateZoneField: PropTypes.func.isRequired,
    geoProvinces: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};

export default injectIntl(ZoneInfosComponent);
