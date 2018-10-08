
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import VillageMap from './VillageMap';
import { deepEqual } from '../../../utils';
import FiltersComponent from '../../../components/FiltersComponent';

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
        const {
            updateVillageField,
            geoProvinces,
            params,
            filters,
        } = this.props;
        return (
            <section className="half-container">
                <div>
                    <div className="filters-container">
                        <FiltersComponent
                            params={params}
                            baseUrl="management/villages"
                            filters={filters}
                        />
                    </div>
                    <div className="align-right">
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
                            step=".00001"
                            name="latitude"
                            placeholder="0.00000"
                            id={`name-${this.state.village.latitude}`}
                            value={this.state.village.latitude}
                            onChange={event => updateVillageField('latitude', event.currentTarget.value)}
                        />
                    </div>
                    <div className="align-right">
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
                            step=".00001"
                            placeholder="0.00000"
                            name="longitude"
                            id={`name-${this.state.village.longitude}`}
                            value={this.state.village.longitude}
                            onChange={event => updateVillageField('longitude', event.currentTarget.value)}
                        />
                    </div>
                </div>
                <div className="village-map-container">
                    <VillageMap
                        baseLayer="2"
                        geoProvinces={geoProvinces}
                    />
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
    params: PropTypes.object.isRequired,
    filters: PropTypes.array.isRequired,
};

export default injectIntl(VillageMapComponent);
