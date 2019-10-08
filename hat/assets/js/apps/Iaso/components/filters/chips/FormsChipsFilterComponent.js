import React from 'react';
import { connect } from 'react-redux';

import PropTypes from 'prop-types';

import formIconUrl from '../../../../../../../dashboard/static/images/white-form.svg';

import { setFormsSelected, setFetching } from '../../../redux/orgUnitsReducer';

import ChipsFilterComponent from './ChipsFilterComponent';

import {
    fetchInstancesAsLocationsByForm,
} from '../../../utils/requests';

function FormsChipsFilterComponent(props) {
    const {
        formsSelected,
        currentForms,
        dispatch,
        currentOrgUnit,
    } = props;
    return (
        <ChipsFilterComponent
            selectLabelMessage={{
                id: 'iaso.orgUnits.addForm',
                defaultMessage: 'Add form',
            }}
            chipIconUrl={formIconUrl}
            locationsKey="instances"
            fetchDetails={form => fetchInstancesAsLocationsByForm(
                dispatch,
                form,
                currentOrgUnit,
            )}
            setSelectedItems={props.setFormsSelected}
            selectedItems={formsSelected}
            currentItems={currentForms}
        />
    );
}

FormsChipsFilterComponent.defaultProps = {
    currentForms: null,
};

FormsChipsFilterComponent.propTypes = {
    currentForms: PropTypes.any,
    currentOrgUnit: PropTypes.object.isRequired,
    formsSelected: PropTypes.array.isRequired,
    setFormsSelected: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    currentForms: state.orgUnits.currentForms,
    formsSelected: state.orgUnits.currentFormsSelected,
    currentOrgUnit: state.orgUnits.current,
    orgUnitTypes: state.orgUnits.orgUnitTypes,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setFormsSelected: forms => dispatch(setFormsSelected(forms)),
    setFetching: fetching => dispatch(setFetching(fetching)),
});

export default connect(MapStateToProps, MapDispatchToProps)(FormsChipsFilterComponent);
