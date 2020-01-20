
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { filterActions } from '../../../redux/filtersRedux';
import LocationFilters from '../../../components/LocationFilters';

const TestLocationComponent = ({
    testLocationFilters,
    selectTestProvince,
    selectTestZone,
    selectTestArea,
    selectTestVillage,
    onChange,
}) => (
    <section className="location-container">
        <LocationFilters
            isRequired
            isClearable
            filters={testLocationFilters}
            selectProvince={provinceId => selectTestProvince(
                provinceId,
                null,
                null,
                null,
            )}
            selectZone={zoneId => selectTestZone(
                zoneId,
                null,
                null,
            )}
            selectArea={areaId => selectTestArea(
                areaId,
                testLocationFilters.zoneId,
                null,
            )}
            selectVillage={(villageId) => {
                onChange('villageId', villageId, 'currentTest');
                selectTestVillage(villageId);
            }}
        />
    </section>
);

TestLocationComponent.propTypes = {
    onChange: PropTypes.func.isRequired,
    testLocationFilters: PropTypes.object.isRequired,
    selectTestProvince: PropTypes.func.isRequired,
    selectTestZone: PropTypes.func.isRequired,
    selectTestArea: PropTypes.func.isRequired,
    selectTestVillage: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    testLocationFilters: state.testLocationFilters,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    selectTestProvince: (provinceId, zoneId, areaId, villageId) => dispatch(filterActions.selectProvince(provinceId, dispatch, zoneId, areaId, villageId)),
    selectTestZone: (zoneId, areaId, villageId) => dispatch(filterActions.selectZone(zoneId, dispatch, true, areaId, villageId)),
    selectTestArea: (areaId, zoneId, villageId) => dispatch(filterActions.selectArea(areaId, dispatch, true, zoneId, villageId)),
    selectTestVillage: villageId => dispatch(filterActions.selectVillage(villageId)),
});


export default connect(MapStateToProps, MapDispatchToProps)(TestLocationComponent);
