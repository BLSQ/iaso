import React, { Component } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Grid } from '@material-ui/core';

import {
    createForm,
    updateForm,
    createFormVersion,
    deleteForm,
} from '../../../utils/requests';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../components/forms/InputComponent';
import FileInputComponent from '../../../components/forms/FileInputComponent';
import { enqueueSnackbar } from '../../../redux/snackBarsReducer';
import { succesfullSnackBar } from '../../../constants/snackBars';
import {
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_YEAR,
} from '../../periods/constants';
import { setIsLoadingForm } from '../actions';
import MESSAGES from '../messages';
import { commaSeparatedIdsToArray } from '../../../utils/forms';

// TODO: use config file
const periodTypeOptions = [
    PERIOD_TYPE_MONTH,
    PERIOD_TYPE_QUARTER,
    PERIOD_TYPE_YEAR,
].map(periodType => ({
    value: periodType,
    label: MESSAGES[periodType.toLowerCase()],
}));

export class FormDialogComponent extends Component {
    constructor(props) {
        super(props);

        this.state = this.initialState(); // TODO: defer - this will be called for each item in the list
    }

    onConfirm(closeDialog) {
        // TODO: messy & hard to follow... move in async action & use async/await to avoid callback hell
        let isUpdate;
        let saveForm;
        let formData;
        const { dispatch } = this.props;
        if (this.props.initialData === null) {
            isUpdate = false;
            formData = _.mapValues(
                _.omit(this.state, ['xls_file', 'form_id']),
                v => v.value,
            );
            saveForm = createForm(this.props.dispatch, formData);
        } else {
            isUpdate = true;
            formData = _.mapValues(
                _.omit(this.state, 'xls_file'),
                v => v.value,
            );
            saveForm = updateForm(
                this.props.dispatch,
                this.state.id.value,
                formData,
            );
        }
        dispatch(setIsLoadingForm(true));
        return saveForm
            .then(savedFormData => {
                if (isUpdate && this.state.xls_file.value === null) {
                    // allow form update without new version
                    return Promise.resolve();
                }
                return createFormVersion(
                    this.props.dispatch,
                    {
                        form_id: savedFormData.id,
                        xls_file: this.state.xls_file.value,
                    },
                    isUpdate,
                ).catch(createVersionError => {
                    // when creating form, if version creation fails, delete freshly created, version-less form
                    if (!isUpdate) {
                        return deleteForm(this.props.dispatch, savedFormData.id)
                            .then(() => console.log('Form deleted'))
                            .catch(() =>
                                console.warn('Form could not be deleted'),
                            )
                            .then(() => {
                                throw createVersionError;
                            });
                    }
                    throw createVersionError;
                });
            })
            .then(() => {
                closeDialog();
                this.props.dispatch(enqueueSnackbar(succesfullSnackBar()));
                this.props.onSuccess();
            })
            .catch(error => {
                if (error.status === 400) {
                    Object.entries(error.details).forEach(
                        ([errorKey, errorMessages]) => {
                            this.setFieldErrors(errorKey, errorMessages);
                        },
                    );
                }
            })
            .then(() => {
                dispatch(setIsLoadingForm(false));
            });
    }

    setFieldValue(fieldName, fieldValue) {
        this.setState({ [fieldName]: { value: fieldValue, errors: [] } });
    }

    setFieldErrors(fieldName, fieldErrors) {
        this.setState(state => ({
            [fieldName]: { value: state[fieldName].value, errors: fieldErrors },
        }));
    }

    setPeriodType(value) {
        this.setFieldValue('period_type', value);
        if (value === null) {
            this.setFieldValue('single_per_period', false);
            this.setFieldValue('periods_before_allowed', 0);
            this.setFieldValue('periods_after_allowed', 0);
        } else {
            this.setFieldValue('periods_before_allowed', 3);
            this.setFieldValue('periods_after_allowed', 3);
        }
    }

    initialState() {
        // TODO: useFormState hook or something, this is going to happen often
        const initialData = this.props.initialData
            ? this.props.initialData
            : {};

        const projectIds = _.get(initialData, 'projects', []).map(p => p.id);
        const orgUnitTypeIds = _.get(initialData, 'org_unit_types', []).map(
            out => out.id,
        );

        return {
            id: { value: _.get(initialData, 'id', null), errors: [] },
            name: { value: _.get(initialData, 'name', ''), errors: [] },
            xls_file: { value: null, errors: [] },
            project_ids: { value: projectIds, errors: [] },
            org_unit_type_ids: { value: orgUnitTypeIds, errors: [] },
            period_type: {
                value: _.get(initialData, 'period_type', null),
                errors: [],
            },
            derived: {
                value: _.get(initialData, 'derived', false),
                errors: [],
            },
            single_per_period: {
                value: _.get(initialData, 'single_per_period', false),
                errors: [],
            },
            periods_before_allowed: {
                value: _.get(initialData, 'periods_before_allowed', 0),
                errors: [],
            },
            periods_after_allowed: {
                value: _.get(initialData, 'periods_after_allowed', 0),
                errors: [],
            },
            device_field: {
                value: _.get(initialData, 'device_field', 'deviceid'),
                errors: [],
            },
            location_field: {
                value: _.get(initialData, 'location_field', ''),
                errors: [],
            },
        };
    }

    render() {
        const {
            renderTrigger,
            projects,
            orgUnitTypes,
            titleMessage,
        } = this.props;

        return (
            <ConfirmCancelDialogComponent
                renderTrigger={renderTrigger}
                titleMessage={titleMessage}
                onConfirm={closeDialog => this.onConfirm(closeDialog)}
                confirmMessage={MESSAGES.save}
                onClosed={() => this.setState(this.initialState())}
                cancelMessage={MESSAGES.cancel}
                maxWidth="md"
            >
                <Grid container spacing={2} justify="flex-start">
                    <Grid xs={6} item>
                        <InputComponent
                            keyValue="name"
                            onChange={(key, value) =>
                                this.setFieldValue(key, value)
                            }
                            value={this.state.name.value}
                            errors={this.state.name.errors}
                            type="text"
                            label={MESSAGES.name}
                            required
                        />
                        <Grid container direction="column">
                            <Grid item>
                                <FileInputComponent
                                    keyValue="xls_file"
                                    onChange={(key, value) =>
                                        this.setFieldValue(key, value)
                                    }
                                    label={MESSAGES.xls_form_file}
                                    errors={this.state.xls_file.errors}
                                    required
                                />
                            </Grid>
                        </Grid>
                        <InputComponent
                            keyValue="period_type"
                            clearable
                            onChange={(key, value) => this.setPeriodType(value)}
                            value={this.state.period_type.value}
                            errors={this.state.period_type.errors}
                            type="select"
                            options={periodTypeOptions}
                            label={MESSAGES.periodType}
                        />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <InputComponent
                                    keyValue="periods_before_allowed"
                                    disabled={
                                        this.state.period_type.value === null
                                    }
                                    onChange={(key, value) =>
                                        this.setFieldValue(key, value)
                                    }
                                    value={
                                        this.state.periods_before_allowed.value
                                    }
                                    errors={
                                        this.state.periods_before_allowed.errors
                                    }
                                    type="number"
                                    label={MESSAGES.periodsBeforeAllowed}
                                    required
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <InputComponent
                                    keyValue="periods_after_allowed"
                                    disabled={
                                        this.state.period_type.value === null
                                    }
                                    onChange={(key, value) =>
                                        this.setFieldValue(key, value)
                                    }
                                    value={
                                        this.state.periods_after_allowed.value
                                    }
                                    errors={
                                        this.state.periods_after_allowed.errors
                                    }
                                    type="number"
                                    label={MESSAGES.periodsAfterAllowed}
                                    required
                                />
                            </Grid>
                        </Grid>

                        <InputComponent
                            keyValue="single_per_period"
                            disabled={this.state.period_type.value === null}
                            onChange={(key, value) =>
                                this.setFieldValue(key, value)
                            }
                            value={this.state.single_per_period.value}
                            errors={this.state.single_per_period.errors}
                            type="checkbox"
                            label={MESSAGES.singlePerPeriod}
                        />
                    </Grid>
                    <Grid xs={6} item>
                        <InputComponent
                            multi
                            clearable
                            keyValue="project_ids"
                            onChange={(key, value) =>
                                this.setFieldValue(
                                    key,
                                    commaSeparatedIdsToArray(value),
                                )
                            }
                            value={this.state.project_ids.value.join(',')}
                            errors={this.state.project_ids.errors}
                            type="select"
                            options={projects.map(p => ({
                                label: p.name,
                                value: p.id,
                            }))}
                            label={MESSAGES.projects}
                            required
                        />
                        <InputComponent
                            multi
                            clearable
                            keyValue="org_unit_type_ids"
                            onChange={(key, value) =>
                                this.setFieldValue(
                                    key,
                                    commaSeparatedIdsToArray(value),
                                )
                            }
                            value={this.state.org_unit_type_ids.value.join(',')}
                            errors={this.state.org_unit_type_ids.errors}
                            type="select"
                            options={orgUnitTypes.map(o => ({
                                label: o.name,
                                value: o.id,
                            }))}
                            label={MESSAGES.orgUnitsTypes}
                        />
                        <InputComponent
                            keyValue="device_field"
                            onChange={(key, value) =>
                                this.setFieldValue(key, value)
                            }
                            value={this.state.device_field.value}
                            errors={this.state.device_field.errors}
                            type="text"
                            label={MESSAGES.deviceField}
                        />
                        <InputComponent
                            keyValue="location_field"
                            onChange={(key, value) =>
                                this.setFieldValue(key, value)
                            }
                            value={this.state.location_field.value}
                            errors={this.state.location_field.errors}
                            type="text"
                            label={MESSAGES.locationField}
                        />
                        <InputComponent
                            keyValue="derived"
                            onChange={(key, value) =>
                                this.setFieldValue(key, value)
                            }
                            value={this.state.derived.value}
                            errors={this.state.derived.errors}
                            type="checkbox"
                            required
                            label={MESSAGES.derived}
                        />
                    </Grid>
                </Grid>
            </ConfirmCancelDialogComponent>
        );
    }
}
FormDialogComponent.defaultProps = {
    initialData: null,
};
FormDialogComponent.propTypes = {
    dispatch: PropTypes.func.isRequired,
    orgUnitTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
    projects: PropTypes.arrayOf(PropTypes.object).isRequired,
    onSuccess: PropTypes.func.isRequired,
    initialData: PropTypes.object,
    renderTrigger: PropTypes.func.isRequired,
    titleMessage: PropTypes.object.isRequired,
};
const mapStateToProps = state => ({
    orgUnitTypes: state.orgUnitsTypes.allTypes,
    projects: state.projects.allProjects,
});
const mapDispatchToProps = dispatch => ({ dispatch });
export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(FormDialogComponent);
