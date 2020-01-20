
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import { deepEqual } from '../../../utils';
import ArrayFieldInput from '../../../components/ArrayFieldInput';
import LocationFilters from '../../../components/LocationFilters';
import { geoActions } from '../../../redux/geoRedux';

class ZoneInfosComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            zone: props.zone,
        };
    }

    componentWillMount() {
        const {
            loadProvinces,
            provinces,
        } = this.props;
        loadProvinces(provinces);
    }

    componentDidMount() {
        const {
            selectProvince,
        } = this.props;
        const {
            zone,
        } = this.state;
        selectProvince(zone.province_id);
    }

    componentWillReceiveProps(nextProps) {
        if (!deepEqual(nextProps.zone, this.props.zone, true)) {
            this.setState({
                zone: nextProps.zone,
            });
        }
    }

    selectProvince(provinceId) {
        const {
            updateZoneField,
            selectProvince,
        } = this.props;
        updateZoneField('province_id', provinceId);
        selectProvince(
            provinceId,
        );
    }

    render() {
        const {
            updateZoneField,
            geoFilters,
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
                <div className="location-container">
                    <LocationFilters
                        isRequired
                        isClearable
                        filters={geoFilters}
                        selectProvince={provinceId => this.selectProvince(provinceId)}
                        selectZone={zoneId => this.selectZone(zoneId)}
                        showZones={false}
                        showAreas={false}
                        showVillages={false}
                    />
                </div>
            </div>
        );
    }
}

ZoneInfosComponent.propTypes = {
    zone: PropTypes.object.isRequired,
    updateZoneField: PropTypes.func.isRequired,
    selectProvince: PropTypes.func.isRequired,
    geoFilters: PropTypes.object.isRequired,
    loadProvinces: PropTypes.func.isRequired,
    provinces: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    geoFilters: state.geoFiltersModale,
    provinces: state.geoFilters.provinces,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    loadProvinces: provinces => dispatch(geoActions.loadProvinces(provinces)),
    selectProvince: provinceId => dispatch(geoActions.selectProvince(provinceId, dispatch, null, null, null)),
});

export default connect(MapStateToProps, MapDispatchToProps)(ZoneInfosComponent);
