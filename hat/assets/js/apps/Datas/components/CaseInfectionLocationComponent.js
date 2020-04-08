
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { filterActions } from '../../../redux/filtersRedux';
import LocationFilters from '../../../components/LocationFilters';


class CaseInfectionLocationComponent extends Component {

    componentWillMount() {
        const {
            currentCase,
            selectProvince,
        } = this.props;
        selectProvince(null);
        if (currentCase.infection_location) {
            selectProvince(
                currentCase.infection_location.province_id,
                currentCase.infection_location.ZS_id,
                currentCase.infection_location.AS_id,
                currentCase.infection_location.id,
            );
        }
    }

    componentDidUpdate(prevProps) {
        const {
            currentCase,
            selectProvince,
            currentPatient,
            onChange,
        } = this.props;
        if (prevProps.currentCase.infection_location_type !== currentCase.infection_location_type) {
            if (currentCase.infection_location_type === 'residence') {
                selectProvince(
                    currentPatient.province_id,
                    currentPatient.ZS_id,
                    currentPatient.AS_id,
                    currentPatient.village_id,
                );
                onChange(currentPatient.village_id);
            }
            if (currentCase.infection_location_type === 'test' && currentCase.location && currentCase.location.normalized && currentCase.location.normalized.as) {
                selectProvince(
                    currentCase.location.normalized.as.province_id,
                    currentCase.location.normalized.as.zs_id,
                    currentCase.location.normalized.as.id,
                    currentCase.location.normalized.village_id,
                );

                onChange(currentCase.location.normalized.village_id);
            }
            if (currentCase.infection_location && (currentCase.infection_location_type !== 'residence' && currentCase.infection_location_type !== 'test')) {
                selectProvince(
                    currentCase.infection_location.province_id,
                    currentCase.infection_location.ZS_id,
                    currentCase.infection_location.AS_id,
                    currentCase.infection_location.id,
                );
                onChange(currentCase.infection_location.id);
            }
        }
    }


    componentWillUnmount() {
        const {
            selectProvince,
        } = this.props;
        selectProvince(null);
    }

    selectProvince(provinceId) {
        this.props.selectProvince(provinceId);
        this.props.selectZone(null);
        this.props.selectArea(null);
        this.props.selectVillage(null);
        this.props.onChange(null);
    }

    selectZone(zoneId) {
        this.props.selectZone(zoneId);
        this.props.selectArea(null);
        this.props.selectVillage(null);
        this.props.onChange(null);
    }

    selectArea(areaId) {
        this.props.selectArea(areaId);
        this.props.selectVillage(null);
        this.props.onChange(null);
    }


    render() {
        const {
            testLocationFilters,
            selectVillage,
            onChange,
        } = this.props;
        return (
            <section className="location-container">
                <LocationFilters
                    isRequired
                    isClearable
                    filters={testLocationFilters}
                    selectProvince={provinceId => this.selectProvince(provinceId)}
                    selectZone={zoneId => this.selectZone(zoneId)}
                    selectArea={areaId => this.selectArea(areaId)}
                    selectVillage={(villageId) => {
                        onChange(villageId);
                        selectVillage(villageId);
                    }}
                />
            </section>
        );
    }
}

CaseInfectionLocationComponent.propTypes = {
    onChange: PropTypes.func.isRequired,
    testLocationFilters: PropTypes.object.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    selectVillage: PropTypes.func.isRequired,
    currentCase: PropTypes.object.isRequired,
    currentPatient: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    testLocationFilters: state.testLocationFilters,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    selectProvince: (provinceId, zoneId, areaId, villageId) => dispatch(filterActions.selectProvince(provinceId, dispatch, zoneId, areaId, villageId)),
    selectZone: zoneId => dispatch(filterActions.selectZone(zoneId, dispatch, true, null, null)),
    selectArea: areaId => dispatch(filterActions.selectArea(areaId, dispatch, true, null, null)),
    selectVillage: villageId => dispatch(filterActions.selectVillage(villageId)),
});


export default connect(MapStateToProps, MapDispatchToProps)(CaseInfectionLocationComponent);
