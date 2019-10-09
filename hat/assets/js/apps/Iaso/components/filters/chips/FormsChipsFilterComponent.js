import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';

import {
    withStyles,
    Box,
    Typography,
} from '@material-ui/core';

import formIconUrl from '../../../../../../../dashboard/static/images/white-form.svg';

import { setFormsSelected } from '../../../redux/orgUnitsReducer';

import ChipsFilterComponent from './ChipsFilterComponent';

import {
    fetchInstancesAsLocationsByForm,
} from '../../../utils/requests';
import commonStyles from '../../../styles/common';

const styles = theme => ({
    ...commonStyles(theme),
});


function FormsChipsFilterComponent(props) {
    const {
        classes,
        formsSelected,
        currentForms,
        dispatch,
        currentOrgUnit,
    } = props;
    if (!currentForms || (currentForms && currentForms.length === 0)) return null;
    return (
        <Fragment>
            <Box
                px={2}
                className={classes.innerDrawerToolbar}
                component="div"
            >
                <Typography variant="subtitle1">
                    <FormattedMessage id="iaso.forms.title" defaultMessage="Forms" />
                    :
                </Typography>
            </Box>
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
                displayTotal
            />
        </Fragment>
    );
}

FormsChipsFilterComponent.defaultProps = {
    currentForms: null,
};

FormsChipsFilterComponent.propTypes = {
    classes: PropTypes.object.isRequired,
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
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setFormsSelected: forms => dispatch(setFormsSelected(forms)),
});

export default connect(MapStateToProps, MapDispatchToProps)(withStyles(styles)(FormsChipsFilterComponent));
