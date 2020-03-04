
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import LayersComponent from './LayersComponent';
import LocationMap from './LocationMap';
import { deepEqual } from '../utils';
import FiltersComponent from './FiltersComponent';
import { smallMapActions } from '../redux/smallMapReducer';

class LocationMapComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            location: props.location,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (!deepEqual(nextProps.location, this.props.location, true)) {
            this.setState({
                location: nextProps.location,
            });
        }
    }

    render() {
        const { baseLayer } = this.props.map;
        const {
            updateField,
            geoProvinces,
            geoZones,
            geoAreas,
            params,
            filters,
            updateLocation,
            baseUrl,
        } = this.props;
        const {
            location,
        } = this.state;
        return (
            <section className="third-container">
                <div>
                    <div className="filters-container">
                        {/* <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            filters={filters}
                        /> */}
                    </div>
                    <div>
                        <label
                            htmlFor={`latitude-${location.id}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.latitude"
                                defaultMessage="Latitude"
                            />
                            :
                        </label>
                        <input
                            type="number"
                            step=".001"
                            name="latitude"
                            placeholder="0.00000"
                            id={`latitude-${location.id}`}
                            className={!location.latitude ? 'form-error' : ''}
                            value={location.latitude ? location.latitude : 0}
                            onChange={event => updateField('latitude', event.currentTarget.value)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={`longitude-${location.id}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.longitude"
                                defaultMessage="Longitude"
                            />
                            :
                        </label>
                        <input
                            type="number"
                            step=".001"
                            placeholder="0.00000"
                            name="longitude"
                            id={`longitude-${location.id}`}
                            value={location.longitude ? location.longitude : 0}
                            className={!location.longitude ? 'form-error' : ''}
                            onChange={event => updateField('longitude', event.currentTarget.value)}
                        />
                    </div>
                    <div className="location-map-layers-container">
                        <LayersComponent
                            base={baseLayer}
                            change={(type, key) => this.props.changeLayer(type, key)}
                        />
                    </div>
                </div>
                <div className="location-map-container">
                    {
                        geoAreas.features && geoProvinces.features && geoZones.features
                        && (
                            <LocationMap
                                baseLayer={baseLayer}
                                geoJson={{
                                    provinces: geoProvinces,
                                    zs: geoZones,
                                    as: geoAreas,
                                }}
                                location={location}
                                updatePosition={(lat, lng) => this.props.updatePosition(lat, lng)}
                                filters={filters}
                                updateLocation={newLocation => updateLocation(newLocation)}
                            />
                        )
                    }
                    {

                        (!geoAreas.features || !geoProvinces.features || !geoZones.features)
                        && <i className="fa fa-spinner fa-pulse fa-5x fa-fw" />
                    }
                </div>
            </section>
        );
    }
}

LocationMapComponent.propTypes = {
    location: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    updateField: PropTypes.func.isRequired,
    geoProvinces: PropTypes.object.isRequired,
    geoZones: PropTypes.object.isRequired,
    geoAreas: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    filters: PropTypes.array.isRequired,
    map: PropTypes.object.isRequired,
    changeLayer: PropTypes.func.isRequired,
    updatePosition: PropTypes.func.isRequired,
    updateLocation: PropTypes.func.isRequired,
    baseUrl: PropTypes.string.isRequired,
};

const MapStateToProps = state => ({
    map: state.smallMap,
    load: state.load,
    geoProvinces: state.smallMap.geoProvinces,
    geoZones: state.smallMap.geoZones,
    geoAreas: state.smallMap.geoAreas,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    changeLayer: (type, key) => dispatch(smallMapActions.changeLayer(type, key)),
});

const LocationMapComponentWithIntl = injectIntl(LocationMapComponent);


export default connect(MapStateToProps, MapDispatchToProps)(LocationMapComponentWithIntl);
