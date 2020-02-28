import React, { Component } from 'react';
import _ from 'lodash';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Grid } from '@material-ui/core';

import {
    createForm,
    createFormVersion,
} from '../../utils/requests';

import FormDialogComponent from './FormDialogComponent';
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
    static blankFormState() {
        return {
            name: null,
            xls_file: null,
            project_ids: null,
            org_unit_type_ids: null,
            period_type: 'TRACKER',
            single_per_period: false,
            device_field: 'deviceid',
            location_field: null,
        };
    }

    constructor(props) {
        super(props);
        this.state = AddFormDialogComponent.blankFormState();
    }

    onSave(closeDialog) {
        // TODO: move in async action
        const formData = _.omit(this.state, 'xls_file');
        createForm(this.props.dispatch, formData)
            .then((createdFormData) => {
                createFormVersion(this.props.dispatch, {
                    form_id: createdFormData.id,
                    xls_file: this.state.xls_file,
                })
                    .then(() => {
                        this.setState(AddFormDialogComponent.blankFormState());
                        closeDialog();
                        // TODO: trigger list reload
                    });
            })
            .catch((error) => {
                console.error(error);
            });
    }

    setFieldValue(fieldName, fieldValue) {
        this.setState({ [fieldName]: fieldValue });
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
            <FormDialogComponent
                dialogTitleMessage={{ id: 'iaso.forms.create', defaultMessage: 'Create form' }}
                onSave={closeDialog => this.onSave(closeDialog)}
            >
                <Grid container spacing={2} justify="flex-start">
                    <Grid xs={6} item>
                        <InputComponent
                            keyValue="name"
                            onChange={(key, value) => this.setFieldValue(key, value)}
                            value={this.state.name}
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
                            value={this.state.project_ids}
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
                            value={this.state.org_unit_type_ids}
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
                            value={this.state.period_type}
                            type="select"
                            options={PERIOD_TYPE_CHOICES}
                            label={{
                                id: 'iaso.label.periodType',
                                defaultMessage: 'Period type',
                            }}
                            required
                        />
                        {
                            this.state.period_type !== 'TRACKER'
                                      && (
                                          <InputComponent
                                              keyValue="single_per_period"
                                              onChange={(key, value) => this.setFieldValue(key, value)}
                                              value={this.state.single_per_period}
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
                            required
                        />
                        <InputComponent
                            keyValue="device_field"
                            onChange={(key, value) => this.setFieldValue(key, value)}
                            value={this.state.device_field}
                            type="text"
                            label={{
                                id: 'iaso.label.deviceField',
                                defaultMessage: 'Device field',
                            }}
                        />
                        <InputComponent
                            keyValue="location_field"
                            onChange={(key, value) => this.setFieldValue(key, value)}
                            value={this.state.location_field}
                            type="text"
                            label={{
                                id: 'iaso.label.locationField',
                                defaultMessage: 'Location field',
                            }}
                        />
                    </Grid>
                </Grid>
            </FormDialogComponent>
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
