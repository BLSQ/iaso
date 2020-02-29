import React, { Component } from 'react';
import _ from 'lodash';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Grid } from '@material-ui/core';

import {
    createForm,
    createFormVersion,
    deleteForm,
} from '../../utils/requests';

import AddButtonComponent from '../buttons/AddButtonComponent';
import ConfirmCancelDialogComponent from './ConfirmCancelDialogComponent';
import InputComponent from '../forms/InputComponent';
import FileInputComponent from '../forms/FileInputComponent';

// TODO: use API to fetch those
const PERIOD_TYPE_CHOICES = [
    {
        label: 'Tracker',
        value: 'TRACKER',
    },
    {
        label: 'Monthly',
        value: 'MONTH',
    },
    {
        label: 'Quarterly',
        value: 'QUARTER',
    },
    {
        label: 'Yearly',
        value: 'YEAR',
    },
];

class AddFormDialogComponent extends Component {
    static blankFormState() { // TODO: useFormState hook or something, this is going to happen often
        return {
            name: { value: null, errors: [] },
            xls_file: { value: null, errors: [] },
            project_ids: { value: null, errors: [] },
            org_unit_type_ids: { value: null, errors: [] },
            period_type: { value: 'TRACKER', errors: [] },
            single_per_period: { value: false, errors: [] },
            device_field: { value: 'deviceid', errors: [] },
            location_field: { value: null, errors: [] },
        };
    }

    constructor(props) {
        super(props);
        this.state = AddFormDialogComponent.blankFormState();
    }

    onSave(closeDialog) {
        // TODO: move in async action
        // TODO: async await
        const formData = _.mapValues(_.omit(this.state, 'xls_file'), v => v.value);
        createForm(this.props.dispatch, formData)
            .then(createdFormData => createFormVersion(this.props.dispatch, {
                form_id: createdFormData.id,
                xls_file: this.state.xls_file.value,
            })
                .then(() => {
                    this.setState(AddFormDialogComponent.blankFormState());
                    closeDialog();
                    // TODO: trigger list reload
                })
                .catch(createVersionError => deleteForm(this.props.dispatch, createdFormData.id)
                    .then(() => {
                        console.log('Form deleted');
                    })
                    .catch((deleteError) => {
                        console.warn('Form could not be deleted');
                    })
                    .then(() => {
                        throw createVersionError;
                    })))
            .catch((error) => {
                if (error.status === 400) {
                    Object.entries(error.details).forEach(([errorKey, errorMessages]) => {
                        this.setFieldErrors(errorKey, errorMessages);
                    });
                }
            });
    }

    onCancel(closeDialog) {
        this.setState(AddFormDialogComponent.blankFormState());
        closeDialog();
    }

    setFieldValue(fieldName, fieldValue) {
        this.setState({ [fieldName]: { value: fieldValue, errors: [] } });
    }

    setFieldErrors(fieldName, fieldErrors) {
        this.setState(state => ({ [fieldName]: { value: state[fieldName].value, errors: fieldErrors } }));
    }

    setPeriodType(value) {
        this.setFieldValue('period_type', value);
        if (value === 'TRACKER') {
            this.setFieldValue('single_per_period', false);
        }
    }

    render() {
        const { projects, orgUnitTypes } = this.props;

        return (
            <ConfirmCancelDialogComponent
                titleMessage={{ id: 'iaso.forms.create', defaultMessage: 'Create form' }}
                renderTrigger={({ openDialog }) => <AddButtonComponent onClick={openDialog} />}
                onConfirm={closeDialog => this.onSave(closeDialog)}
                confirmMessage={{ id: 'iaso.label.save', defaultMessage: 'Save' }}
                onCancel={closeDialog => this.onCancel(closeDialog)}
                cancelMessage={{ id: 'iaso.label.cancel', defaultMessage: 'Cancel' }}
                maxWidth="md"
            >
                <Grid container spacing={2} justify="flex-start">
                    <Grid xs={6} item>
                        <InputComponent
                            keyValue="name"
                            onChange={(key, value) => this.setFieldValue(key, value)}
                            value={this.state.name.value}
                            errors={this.state.name.errors}
                            type="text"
                            label={{
                                id: 'iaso.label.name',
                                defaultMessage: 'Name',
                            }}
                            required
                        />
                        {
                            // TODO: select input component should return a list of values of the same type as the provided values
                        }
                        <InputComponent
                            multi
                            clearable
                            keyValue="project_ids"
                            onChange={(key, value) => this.setFieldValue(key, value.split(', ').map(parseInt))}
                            value={this.state.project_ids.value}
                            errors={this.state.project_ids.errors}
                            type="select"
                            options={projects.map(p => ({
                                label: p.name,
                                value: p.id,
                            }))}
                            label={{
                                id: 'iaso.label.projects',
                                defaultMessage: 'Projects',
                            }}
                            required
                        />
                        {
                            // TODO: select input component should return a list of values of the same type as the provided values
                        }
                        <InputComponent
                            multi
                            clearable
                            keyValue="org_unit_type_ids"
                            onChange={(key, value) => this.setFieldValue(key, value.split(', ').map(parseInt))}
                            value={this.state.org_unit_type_ids.value}
                            errors={this.state.org_unit_type_ids.errors}
                            type="select"
                            options={orgUnitTypes.map(o => ({
                                label: o.name,
                                value: o.id,
                            }))}
                            label={{
                                id: 'iaso.label.orgUnitsTypes',
                                defaultMessage: 'Organisation unit types',
                            }}
                            required
                        />
                        <InputComponent
                            keyValue="period_type"
                            clearable={false}
                            onChange={(key, value) => this.setPeriodType(value)}
                            value={this.state.period_type.value}
                            errors={this.state.period_type.errors}
                            type="select"
                            options={PERIOD_TYPE_CHOICES}
                            label={{
                                id: 'iaso.label.periodType',
                                defaultMessage: 'Period type',
                            }}
                            required
                        />
                        {
                            this.state.period_type.value !== 'TRACKER'
                                      && (
                                          <InputComponent
                                              keyValue="single_per_period"
                                              onChange={(key, value) => this.setFieldValue(key, value)}
                                              value={this.state.single_per_period.value}
                                              errors={this.state.single_per_period.errors}
                                              type="checkbox"
                                              label={{
                                                  id: 'iaso.label.singlePerPeriod',
                                                  defaultMessage: 'Single per period',
                                              }}
                                          />
                                      )
                        }
                    </Grid>
                    <Grid xs={6} item>
                        <FileInputComponent
                            keyValue="xls_file"
                            onChange={(key, value) => this.setFieldValue(key, value)}
                            label={{
                                id: 'iaso.label.xls_form_file',
                                defaultMessage: 'XLSForm file',
                            }}
                            errors={this.state.xls_file.errors}
                            required
                        />
                        <InputComponent
                            keyValue="device_field"
                            onChange={(key, value) => this.setFieldValue(key, value)}
                            value={this.state.device_field.value}
                            errors={this.state.device_field.errors}
                            type="text"
                            label={{
                                id: 'iaso.label.deviceField',
                                defaultMessage: 'Device field',
                            }}
                        />
                        <InputComponent
                            keyValue="location_field"
                            onChange={(key, value) => this.setFieldValue(key, value)}
                            value={this.state.location_field.value}
                            errors={this.state.location_field.errors}
                            type="text"
                            label={{
                                id: 'iaso.label.locationField',
                                defaultMessage: 'Location field',
                            }}
                        />
                    </Grid>
                </Grid>
            </ConfirmCancelDialogComponent>
        );
    }
}
AddFormDialogComponent.propTypes = {
    dispatch: PropTypes.func.isRequired,
    orgUnitTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
    projects: PropTypes.arrayOf(PropTypes.object).isRequired,
};
const mapStateToProps = state => ({
    orgUnitTypes: state.orgUnits.orgUnitTypes,
    projects: state.projects.projects,
});
const mapDispatchToProps = dispatch => ({ dispatch });
export default connect(mapStateToProps, mapDispatchToProps)(AddFormDialogComponent);
