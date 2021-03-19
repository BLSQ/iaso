import React, { Component } from 'react';
import get from 'lodash/get';
import PropTypes from 'prop-types';
import { Grid, Box } from '@material-ui/core';
import { connect } from 'react-redux';
import isEqual from 'lodash/isEqual';

import { createDataSource, updateDataSource } from '../../../utils/requests';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../components/forms/InputComponent';
import { enqueueSnackbar } from '../../../redux/snackBarsReducer';
import { succesfullSnackBar } from '../../../constants/snackBars';

import { setIsLoading } from '../actions';
import MESSAGES from '../messages';
import { commaSeparatedIdsToArray } from '../../../utils/forms';

export class DataSourceDialogComponent extends Component {
    constructor(props) {
        super(props);
        this.state = this.initialState(); // TODO: defer - this will be called for each item in the list
    }

    onConfirm(closeDialog) {
        const { dispatch, initialData, onSuccess } = this.props;

        let saveCurrentDataSource;
        const currentDataSource = {};
        Object.keys(this.state.form).forEach(key => {
            currentDataSource[key] = this.state.form[key].value;
        });

        if (initialData === null) {
            saveCurrentDataSource = createDataSource(
                dispatch,
                currentDataSource,
            );
        } else {
            saveCurrentDataSource = updateDataSource(
                dispatch,
                this.state.form.id.value,
                currentDataSource,
            );
        }
        dispatch(setIsLoading(true));

        return saveCurrentDataSource
            .then(() => {
                closeDialog();
                dispatch(enqueueSnackbar(succesfullSnackBar()));
                onSuccess();
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
                dispatch(setIsLoading(false));
            });
    }

    setFieldValue(fieldName, fieldValue) {
        const { form } = this.state;
        const newForm = {
            ...form,
            [fieldName]: { value: fieldValue, errors: [] },
        };
        if (fieldName === 'is_default_source' && fieldValue === false) {
            newForm.default_version_number = {
                value: null,
                errors: [],
            };
            console.log('ICI', newForm);
        }
        const isDataTouched = !isEqual(this.inititalForm(), newForm);
        this.setState({
            form: newForm,
            isDataTouched,
        });
    }

    setFieldErrors(fieldName, fieldErrors) {
        this.setState({
            form: {
                ...this.state.form,
                [fieldName]: {
                    value: this.state[fieldName].value,
                    errors: fieldErrors,
                },
            },
        });
    }

    inititalForm() {
        const { defaultSourceVersion } = this.props;
        const initialData = this.props.initialData
            ? this.props.initialData
            : {};
        const isDefaultSource =
            initialData &&
            defaultSourceVersion &&
            defaultSourceVersion.source &&
            defaultSourceVersion.source.id === initialData.id;
        let defaultVersionId = null;
        if (isDefaultSource) {
            defaultVersionId =
                defaultSourceVersion &&
                defaultSourceVersion.version &&
                defaultSourceVersion.version.id;
        }
        return {
            id: { value: get(initialData, 'id', null), errors: [] },
            name: { value: get(initialData, 'name', ''), errors: [] },
            read_only: {
                value: get(initialData, 'read_only', false),
                errors: [],
            },
            versions: {
                value: get(initialData, 'versions', []),
                errors: [],
            },
            description: {
                value: get(initialData, 'description', ''),
                errors: [],
            },
            project_ids: {
                value: get(initialData, 'projects', []).map(p => p.id),
                errors: [],
            },
            is_default_source: {
                value: isDefaultSource,
                errors: [],
            },
            default_version_number: {
                value: defaultVersionId,
                errors: [],
            },
        };
    }

    initialState() {
        return {
            isDataTouched: false,
            form: this.inititalForm(),
        };
    }

    render() {
        const {
            renderTrigger,
            projects,
            titleMessage,
            initialData,
        } = this.props;
        const { form, isDataTouched } = this.state;
        let allowConfirm = isDataTouched;
        if (
            form.is_default_source.value &&
            !form.default_version_number.value
        ) {
            allowConfirm = false;
        }
        return (
            <ConfirmCancelDialogComponent
                renderTrigger={renderTrigger}
                titleMessage={titleMessage}
                onConfirm={closeDialog => this.onConfirm(closeDialog)}
                onClosed={() => this.setState(this.initialState())}
                confirmMessage={MESSAGES.save}
                cancelMessage={MESSAGES.cancel}
                maxWidth="sm"
                allowConfirm={allowConfirm}
            >
                <Grid container spacing={4} justify="flex-start">
                    <Grid xs={12} item>
                        <InputComponent
                            keyValue="name"
                            onChange={(key, value) =>
                                this.setFieldValue(key, value)
                            }
                            value={form.name.value}
                            errors={form.name.errors}
                            type="text"
                            label={MESSAGES.dataSourceName}
                            required
                        />

                        <InputComponent
                            keyValue="description"
                            onChange={(key, value) =>
                                this.setFieldValue(key, value)
                            }
                            value={form.description.value}
                            errors={form.description.errors}
                            type="text"
                            label={MESSAGES.dataSourceDescription}
                            multiline
                        />
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
                            value={form.project_ids.value.join(',')}
                            errors={form.project_ids.errors}
                            type="select"
                            options={projects.map(p => ({
                                label: p.name,
                                value: p.id,
                            }))}
                            label={MESSAGES.projects}
                        />
                        <Box>
                            <InputComponent
                                keyValue="read_only"
                                onChange={(key, value) =>
                                    this.setFieldValue(key, value)
                                }
                                value={form.read_only.value}
                                errors={form.read_only.errors}
                                type="checkbox"
                                label={MESSAGES.dataSourceReadOnly}
                            />
                        </Box>
                        <Box>
                            <InputComponent
                                keyValue="is_default_source"
                                disabled={
                                    form.is_default_source.value &&
                                    !isDataTouched
                                }
                                onChange={(key, value) =>
                                    this.setFieldValue(key, value)
                                }
                                value={form.is_default_source.value}
                                errors={form.is_default_source.errors}
                                type="checkbox"
                                label={MESSAGES.defaultSource}
                            />
                            {form.is_default_source.value && (
                                <InputComponent
                                    multi={false}
                                    clearable
                                    keyValue="default_version_number"
                                    onChange={(key, value) =>
                                        this.setFieldValue(key, value)
                                    }
                                    value={form.default_version_number.value}
                                    // value={defaultSourceVersion.version.id}
                                    errors={form.default_version_number.errors}
                                    type="select"
                                    options={
                                        initialData
                                            ? initialData.versions.map(v => ({
                                                  label: v.number,
                                                  value: v.id,
                                              }))
                                            : []
                                    }
                                    label={MESSAGES.defaultVersion}
                                />
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </ConfirmCancelDialogComponent>
        );
    }
}
DataSourceDialogComponent.defaultProps = {
    initialData: null,
    defaultSourceVersion: null,
};
DataSourceDialogComponent.propTypes = {
    dispatch: PropTypes.func.isRequired,
    projects: PropTypes.arrayOf(PropTypes.object).isRequired,
    onSuccess: PropTypes.func.isRequired,
    initialData: PropTypes.object,
    renderTrigger: PropTypes.func.isRequired,
    titleMessage: PropTypes.object.isRequired,
    defaultSourceVersion: PropTypes.object,
};
const mapStateToProps = state => ({
    projects: state.projects.allProjects,
});
const mapDispatchToProps = dispatch => ({ dispatch });
export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(DataSourceDialogComponent);
