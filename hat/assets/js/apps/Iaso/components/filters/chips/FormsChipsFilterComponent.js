import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import {
    withStyles,
    Box,
    Chip,
    Typography,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import formIconUrl from '../../../../../../../dashboard/static/images/white-form.svg';

import commonStyles from '../../../styles/common';

import { setFormsSelected, setFetching } from '../../../redux/orgUnitsReducer';

import InputComponent from '../../forms/InputComponent';

import {
    fetchInstancesAsLocationsByForm,
} from '../../../utils/requests';

const styles = theme => ({
    ...commonStyles(theme),
    chip: {
        marginRight: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
});


class FormsChipsFilterComponent extends Component {
    componentWillUnmount() {
        this.props.setFormsSelected([]);
    }

    onAdd(formId) {
        const {
            formsSelected,
            currentForms,
        } = this.props;
        const newFormsSelected = [...formsSelected];
        const form = currentForms.find(f => f.id === formId);
        if (!newFormsSelected.includes(form)) {
            newFormsSelected.push(form);
            this.updateFormsInstances(newFormsSelected);
        }
    }

    onDelete(form) {
        const {
            formsSelected,
        } = this.props;
        const newFormsSelected = [...formsSelected];
        if (newFormsSelected.includes(form)) {
            newFormsSelected.splice(newFormsSelected.indexOf(form), 1);
        }
        this.props.setFormsSelected(newFormsSelected);
    }

    updateFormsInstances(formsSelected) {
        const {
            dispatch,
            currentOrgUnit,
        } = this.props;
        const promisesArray = [];
        const oldForms = [];
        formsSelected.forEach((f) => {
            if (!f.instances) {
                promisesArray.push(
                    fetchInstancesAsLocationsByForm(
                        dispatch,
                        f,
                        currentOrgUnit,
                    ),
                );
            } else {
                oldForms.push(f);
            }
        });
        this.props.setFetching(true);
        Promise.all(promisesArray).then((forms) => {
            const formsWithData = oldForms.concat(forms);
            this.props.setFormsSelected(formsWithData);
            this.props.setFetching(false);
        });
    }

    render() {
        const {
            classes,
            formsSelected,
            currentForms,
        } = this.props;
        let notSelectedForms = [];
        if (currentForms) {
            notSelectedForms = currentForms.filter(f => !formsSelected.find(fo => fo.id === f.id));
        }
        return (
            <Box
                px={4}
                py={2}
                component="div"
            >
                {
                    formsSelected.length > 0 && (
                        formsSelected.map(f => (
                            <Chip
                                key={f.id}
                                icon={<img src={formIconUrl} className={classes.svgChipIcon} alt="form" />}
                                label={f.name}
                                clickable
                                className={classes.chip}
                                onDelete={() => this.onDelete(f)}
                                style={{
                                    backgroundColor: f.color,
                                    color: 'white',
                                }}
                            />
                        ))
                    )
                }
                {
                    notSelectedForms.length > 0 && (
                        <InputComponent
                            keyValue="form_id"
                            onChange={(key, formId) => this.onAdd(formId)}
                            value={null}
                            type="select"
                            options={
                                notSelectedForms.map(t => ({
                                    label: t.name,
                                    value: t.id,
                                }))
                            }
                            label={{
                                id: 'iaso.orgUnits.addForm',
                                defaultMessage: 'Add form',
                            }}
                        />
                    )
                }
                {
                    currentForms && currentForms.length === 0
                    && formsSelected.length === 0 && (
                        <Typography variant="body1" className={classes.textError}>
                            <FormattedMessage id="iaso.orgUnits.noForm" defaultMessage="No form" />
                        </Typography>
                    )
                }
            </Box>
        );
    }
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
    setFetching: PropTypes.func.isRequired,
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

export default connect(MapStateToProps, MapDispatchToProps)(withStyles(styles)(FormsChipsFilterComponent));
