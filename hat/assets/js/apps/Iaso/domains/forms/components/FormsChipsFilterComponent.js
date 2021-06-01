import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';

import { withStyles, Box, Typography } from '@material-ui/core';

import { commonStyles } from 'bluesquare-components';
import { setFormsSelected } from '../../orgUnits/actions';

import ChipsFilterComponent from '../../../components/filters/chips/ChipsFilterComponent';

import { fetchInstancesAsLocationsByForm } from '../../../utils/requests';

import MESSAGES from '../messages';

const styles = theme => ({
    ...commonStyles(theme),
    content: {
        padding: theme.spacing(0, 3, 2, 3),
    },
});

export function FormsChipsFilterComponent(props) {
    const {
        classes,
        formsSelected,
        currentForms,
        dispatch,
        currentOrgUnit,
        fitToBounds,
    } = props;
    return (
        <>
            <Box px={2} className={classes.innerDrawerToolbar} component="div">
                <Typography variant="subtitle1">
                    <FormattedMessage {...MESSAGES.title} />
                </Typography>
            </Box>
            {(!currentForms || (currentForms && currentForms.length === 0)) && (
                <Typography
                    variant="body2"
                    align="center"
                    color="textSecondary"
                >
                    <FormattedMessage {...MESSAGES.noForm} />
                </Typography>
            )}
            <ChipsFilterComponent
                selectLabelMessage={MESSAGES.addForm}
                locationsKey="instances"
                fetchDetails={form =>
                    fetchInstancesAsLocationsByForm(
                        dispatch,
                        form,
                        currentOrgUnit,
                        fitToBounds,
                    )
                }
                setSelectedItems={props.setFormsSelected}
                selectedItems={formsSelected}
                currentItems={currentForms}
                displayTotal
            />
        </>
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
    fitToBounds: PropTypes.func.isRequired,
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

export default connect(
    MapStateToProps,
    MapDispatchToProps,
)(withStyles(styles)(FormsChipsFilterComponent));
