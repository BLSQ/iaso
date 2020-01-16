
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import { deepEqual } from '../../../utils';
import ArrayFieldInput from '../../../components/ArrayFieldInput';
import LocationFilters from '../../../components/LocationFilters';
import { geoActions } from '../../../redux/geoRedux';

class AreaInfosComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            area: props.area,
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
            area,
        } = this.state;
        selectProvince(area.ZS__province_id, area.ZS_id);
    }

    componentWillReceiveProps(nextProps) {
        if (!deepEqual(nextProps.area, this.props.area, true)) {
            this.setState({
                area: nextProps.area,
            });
        }
    }

    selectProvince(provinceId) {
        const {
            updateAreaField,
            selectProvince,
        } = this.props;
        updateAreaField('ZS__province_id', provinceId);
        selectProvince(
            provinceId,
        );
    }

    selectZone(zoneId) {
        const {
            updateAreaField,
            selectZone,
        } = this.props;
        updateAreaField('ZS_id', zoneId);
        selectZone(
            zoneId,
        );
    }

    render() {
        const {
            updateAreaField,
            geoFilters,
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
                        className={(!area.source || area.source === '') ? 'form-error' : ''}
                        value={area.source || ''}
                        onChange={event => updateAreaField('source', event.currentTarget.value)}
                    />
                </div>
                <div className="location-container">
                    <LocationFilters
                        isRequired
                        isClearable
                        filters={geoFilters}
                        selectProvince={provinceId => this.selectProvince(provinceId)}
                        selectZone={zoneId => this.selectZone(zoneId)}
                        showAreas={false}
                        showVillages={false}
                    />
                </div>
            </section>
        );
    }
}

AreaInfosComponent.propTypes = {
    area: PropTypes.object.isRequired,
    updateAreaField: PropTypes.func.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
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
    selectProvince: (provinceId, zoneId) => dispatch(geoActions.selectProvince(provinceId, dispatch, zoneId, null, null)),
    selectZone: zoneId => dispatch(geoActions.selectZone(zoneId, dispatch, true, null, null)),
});

export default connect(MapStateToProps, MapDispatchToProps)(AreaInfosComponent);
