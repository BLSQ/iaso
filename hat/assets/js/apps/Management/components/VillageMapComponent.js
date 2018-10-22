
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import LayersComponent from '../../../components/LayersComponent';
import VillageMap from './VillageMap';
import { deepEqual } from '../../../utils';
import FiltersComponent from '../../../components/FiltersComponent';
import { mapActions } from '../redux/mapReducer';

class VillageMapComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            village: props.village,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (!deepEqual(nextProps.village, this.props.village, true)) {
            this.setState({
                village: nextProps.village,
            });
        }
    }

    render() {
        const { baseLayer } = this.props.map;
        const {
            updateVillageField,
            geoProvinces,
            geoZones,
            geoAreas,
            params,
            filters,
            updateVillageLocation,
        } = this.props;
        return (
            <section className="third-container">
                <div>
                    <div className="filters-container">
                        <FiltersComponent
                            params={params}
                            baseUrl="management/villages"
                            filters={filters}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={`name-${this.state.village.latitude}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.lat"
                                defaultMessage="Latitude"
                            />:
                        </label>
                        <input
                            type="number"
                            step=".001"
                            name="latitude"
                            placeholder="0.00000"
                            id={`name-${this.state.village.latitude}`}
                            className={!this.state.village.latitude ? 'form-error' : ''}
                            value={this.state.village.latitude}
                            onChange={event => updateVillageField('latitude', event.currentTarget.value)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={`name-${this.state.village.longitude}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.longitude"
                                defaultMessage="Longitude"
                            />:
                        </label>
                        <input
                            type="number"
                            step=".001"
                            placeholder="0.00000"
                            name="longitude"
                            id={`name-${this.state.village.longitude}`}
                            value={this.state.village.longitude}
                            className={!this.state.village.longitude ? 'form-error' : ''}
                            onChange={event => updateVillageField('longitude', event.currentTarget.value)}
                        />
                    </div>
                    <div className="village-map-layers-container">
                        <LayersComponent
                            base={baseLayer}
                            change={(type, key) => this.props.changeLayer(type, key)}
                        />
                    </div>
                </div>
                <div className="village-map-container">
                    {
                        geoAreas.features && geoProvinces.features && geoZones.features &&
                        <VillageMap
                            baseLayer={baseLayer}
                            geoJson={{
                                provinces: geoProvinces,
                                zs: geoZones,
                                as: geoAreas,
                            }}
                            village={this.state.village}
                            updateVillagePosition={(lat, lng) => this.props.updateVillagePosition(lat, lng)}
                            filters={filters}
                            updateVillageLocation={location => updateVillageLocation(location)}
                        />
                    }
                    {

                        (!geoAreas.features || !geoProvinces.features || !geoZones.features) &&
                        <i className="fa fa-spinner fa-pulse fa-5x fa-fw" />
                    }
                </div>
            </section>
        );
    }
}

VillageMapComponent.propTypes = {
    village: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    updateVillageField: PropTypes.func.isRequired,
    geoProvinces: PropTypes.object.isRequired,
    geoZones: PropTypes.object.isRequired,
    geoAreas: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    filters: PropTypes.array.isRequired,
    map: PropTypes.object.isRequired,
    changeLayer: PropTypes.func.isRequired,
    updateVillagePosition: PropTypes.func.isRequired,
    updateVillageLocation: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    map: state.map,
    load: state.load,
    geoProvinces: state.villages.geoProvinces,
    geoZones: state.villages.geoZones,
    geoAreas: state.villages.geoAreas,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    changeLayer: (type, key) => dispatch(mapActions.changeLayer(type, key)),
});

const VillageMapComponentWithIntl = injectIntl(VillageMapComponent);


export default connect(MapStateToProps, MapDispatchToProps)(VillageMapComponentWithIntl);
