
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { filterActions } from '../../../redux/filtersRedux';
import LocationFilters from '../../../components/LocationFilters';


class CaseLocationComponent extends Component {
    componentWillMount() {
        const {
            currentCase,
            selectProvince,
        } = this.props;
        selectProvince(null);
        if (currentCase.location.normalized && currentCase.location.normalized.as) {
            const currentAs = currentCase.location.normalized.as;
            selectProvince(
                currentAs.province_id,
                currentAs.zs_id, currentAs.id,
                currentCase.location.normalized.village_id,
            );
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

CaseLocationComponent.propTypes = {
    onChange: PropTypes.func.isRequired,
    testLocationFilters: PropTypes.object.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    selectArea: PropTypes.func.isRequired,
    selectVillage: PropTypes.func.isRequired,
    currentCase: PropTypes.object.isRequired,
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


export default connect(MapStateToProps, MapDispatchToProps)(CaseLocationComponent);
