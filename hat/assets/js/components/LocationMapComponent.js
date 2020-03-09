
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import LayersComponent from './LayersComponent';
import LocationMap from './LocationMap';
import FiltersComponent from './FiltersComponent';
import { smallMapActions } from '../redux/smallMapReducer';

import {
    isCoordInsidePolygon,
} from '../utils/map/mapUtils';

class LocationMapComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            asGroup: null,
        };
    }

    setAsGroup(asGroup) {
        this.setState({
            asGroup,
        });
    }


    getLocation(featureItem) {
        const {
            geoZones,
        } = this.props;
        const zone = geoZones.features.filter(z => parseInt(z.id, 10) === featureItem.properties.ZS)[0];
        const zsId = parseInt(zone.id, 10);
        const provinceId = parseInt(zone.properties.province, 10);
        const asId = parseInt(featureItem.id, 10);
        return {
            AS__ZS_id: zsId,
            AS__ZS__province_id: provinceId,
            AS_id: asId,
        };
    }

    updateVillage(newVillage) {
        const {
            updateCurrentVillage,
        } = this.props;
        const {
            asGroup,
        } = this.state;
        let tempVillage = {
            ...newVillage,
            latitude: parseFloat(newVillage.latitude),
            longitude: parseFloat(newVillage.longitude),
        };
        if (asGroup) {
            asGroup.eachLayer((layer) => {
                layer.eachLayer((areaLayer) => {
                    if (isCoordInsidePolygon(
                        [
                            tempVillage.latitude,
                            tempVillage.longitude,
                        ],
                        areaLayer,
                    )) {
                        if (areaLayer.feature.properties.ZS) {
                            tempVillage = {
                                ...tempVillage,
                                ...this.getLocation(areaLayer.feature),
                            };
                        }
                    }
                });
            });
        }
        updateCurrentVillage(tempVillage);
    }

    render() {
        const { baseLayer } = this.props.map;
        const {
            geoProvinces,
            geoZones,
            geoAreas,
            params,
            filters,
            baseUrl,
            location,
        } = this.props;
        return (
            <section className="third-container">
                <div>
                    <div className="filters-container">
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            filters={filters}
                        />
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
                            onChange={event => this.updateVillage({
                                ...location,
                                latitude: parseFloat(event.currentTarget.value),
                            })}
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
                            onChange={event => this.updateVillage({
                                ...location,
                                longitude: parseFloat(event.currentTarget.value),
                            })}
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
                                updateCurrentVillage={newVillage => this.updateVillage(newVillage)}
                                filters={filters}
                                setAsGroup={asGroup => this.setAsGroup(asGroup)}
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
    updateCurrentVillage: PropTypes.func.isRequired,
    geoProvinces: PropTypes.object.isRequired,
    geoZones: PropTypes.object.isRequired,
    geoAreas: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    filters: PropTypes.array.isRequired,
    map: PropTypes.object.isRequired,
    changeLayer: PropTypes.func.isRequired,
    baseUrl: PropTypes.string.isRequired,
};

const MapStateToProps = state => ({
    map: state.smallMap,
    load: state.load,
    geoProvinces: state.smallMap.geoProvinces,
    geoZones: state.smallMap.geoZones,
    geoAreas: state.smallMap.geoAreas,
    location: state.villages.current,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    changeLayer: (type, key) => dispatch(smallMapActions.changeLayer(type, key)),
});

const LocationMapComponentWithIntl = injectIntl(LocationMapComponent);


export default connect(MapStateToProps, MapDispatchToProps)(LocationMapComponentWithIntl);
