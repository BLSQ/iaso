
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import Select from 'react-select';

import { deepEqual } from '../../../utils';
import ArrayFieldInput from '../../../components/ArrayFieldInput';

export const getGeoList = (geoJson) => {
    const itemsList = [];
    geoJson.features.forEach((f) => {
        itemsList.push({
            id: f.id,
            ...f.properties,
        });
    });
    return itemsList;
};

const getGeoZoneList = (geoJson, provinceId) => {
    const zonesList = getGeoList(geoJson);
    if (provinceId) {
        return (zonesList.filter(z => z.province === provinceId));
    }

    return zonesList;
};

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
            geoProvinces,
            geoZones,
            intl: {
                formatMessage,
            },
        } = this.props;
        const { area } = this.state;
        return (
            <section>
                <div>
                    <label
                        htmlFor={`name-${area.id}`}
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
                        id={`name-${area.id}`}
                        className={(!area.name || area.name === '') ? 'form-error' : ''}
                        value={area.name}
                        onChange={event => updateAreaField('name', event.currentTarget.value)}
                    />
                </div>
                <div className="display-flex">
                    <label
                        htmlFor={`aliases-${area.id}`}
                        className="filter__container__select__label"
                    >
                        <FormattedMessage
                            id="main.label.aliases"
                            defaultMessage="Alias"
                        />
                        :
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
                        />
                        :
                    </label>
                    <input
                        type="text"
                        name="source"
                        id={`source-${area.id}`}
                        value={area.source}
                        onChange={event => updateAreaField('source', event.currentTarget.value)}
                    />
                </div>
                <div>
                    <label
                        htmlFor={`province-${area.id}`}
                        className="filter__container__select__label"
                    >
                        <FormattedMessage
                            id="main.label.province"
                            defaultMessage="Province"
                        />
                        :
                    </label>
                    <Select
                        className={!area.ZS__province_id ? 'form-error' : null}
                        multi={false}
                        clearable={false}
                        simpleValue
                        name={`province-${area.id}`}
                        value={area.ZS__province_id}
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
                        onChange={value => updateAreaField('ZS__province_id', value)}
                    />
                </div>
                <div>
                    <label
                        htmlFor={`zone-${area.id}`}
                        className="filter__container__select__label"
                    >
                        <FormattedMessage
                            id="main.label.zone_short"
                            defaultMessage="Zone"
                        />
                        :
                    </label>
                    <Select
                        className={!area.ZS_id ? 'form-error' : null}
                        disable={!area.ZS__province_id}
                        multi={false}
                        clearable={false}
                        simpleValue
                        name={`zone-${area.id}`}
                        value={area.ZS_id}
                        placeholder={formatMessage({
                            id: 'main.label.zoneSelect',
                            defaultMessage: 'Select a zone',
                        })}
                        noResultsText={<FormattedMessage id="main.label.noresult" defaultMessage="No result" />}
                        options={getGeoZoneList(geoZones, area.ZS__province_id).map(z => (
                            {
                                label: z.name,
                                value: z.id,
                            }
                        ))}
                        onChange={value => updateAreaField('ZS_id', value)}
                    />
                </div>
            </section>
        );
    }
}

AreaInfosComponent.propTypes = {
    area: PropTypes.object.isRequired,
    updateAreaField: PropTypes.func.isRequired,
    geoProvinces: PropTypes.object.isRequired,
    geoZones: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};

export default injectIntl(AreaInfosComponent);
