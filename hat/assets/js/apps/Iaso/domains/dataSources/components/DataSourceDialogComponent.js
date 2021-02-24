import React, { Component } from 'react';
import get from 'lodash/get';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import { connect } from 'react-redux';

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
        Object.keys(this.state).forEach(key => {
            currentDataSource[key] = this.state[key].value;
        });

        if (initialData === null) {
            saveCurrentDataSource = createDataSource(
                dispatch,
                currentDataSource,
            );
        } else {
            saveCurrentDataSource = updateDataSource(
                dispatch,
                this.state.id.value,
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
        this.setState({ [fieldName]: { value: fieldValue, errors: [] } });
    }

    setFieldErrors(fieldName, fieldErrors) {
        this.setState(state => ({
            [fieldName]: { value: state[fieldName].value, errors: fieldErrors },
        }));
    }

    initialState() {
        const initialData = this.props.initialData
            ? this.props.initialData
            : {};

        return {
            id: { value: get(initialData, 'id', null), errors: [] },
            name: { value: get(initialData, 'name', ''), errors: [] },
            read_only: {
                value: get(initialData, 'read_only', false),
                errors: [],
            },
            // versions: {
            //     value: get(initialData, 'versions', []),
            //     errors: [],
            // },
            description: {
                value: get(initialData, 'description', ''),
                errors: [],
            },
            project_ids: {
                value: get(initialData, 'projects', []).map(p => p.id),
                errors: [],
            },
        };
    }

    render() {
        const { renderTrigger, projects, titleMessage } = this.props;

        return (
            <ConfirmCancelDialogComponent
                renderTrigger={renderTrigger}
                titleMessage={titleMessage}
                onConfirm={closeDialog => this.onConfirm(closeDialog)}
                onClosed={() => this.setState(this.initialState())}
                confirmMessage={MESSAGES.save}
                cancelMessage={MESSAGES.cancel}
                maxWidth="sm"
            >
                <Grid container spacing={4} justify="flex-start">
                    <Grid xs={12} item>
                        <InputComponent
                            keyValue="name"
                            onChange={(key, value) =>
                                this.setFieldValue(key, value)
                            }
                            value={this.state.name.value}
                            errors={this.state.name.errors}
                            type="text"
                            label={MESSAGES.dataSourceName}
                            required
                        />
                        <InputComponent
                            keyValue="read_only"
                            onChange={(key, value) =>
                                this.setFieldValue(key, value)
                            }
                            value={this.state.read_only.value}
                            errors={this.state.read_only.errors}
                            type="checkbox"
                            label={MESSAGES.dataSourceReadOnly}
                        />

                        <InputComponent
                            keyValue="description"
                            onChange={(key, value) =>
                                this.setFieldValue(key, value)
                            }
                            value={this.state.description.value}
                            errors={this.state.description.errors}
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
                            value={this.state.project_ids.value.join(',')}
                            errors={this.state.project_ids.errors}
                            type="select"
                            options={projects.map(p => ({
                                label: p.name,
                                value: p.id,
                            }))}
                            label={MESSAGES.projects}
                        />
                    </Grid>
                </Grid>
            </ConfirmCancelDialogComponent>
        );
    }
}
DataSourceDialogComponent.defaultProps = {
    initialData: null,
};
DataSourceDialogComponent.propTypes = {
    dispatch: PropTypes.func.isRequired,
    projects: PropTypes.arrayOf(PropTypes.object).isRequired,
    onSuccess: PropTypes.func.isRequired,
    initialData: PropTypes.object,
    renderTrigger: PropTypes.func.isRequired,
    titleMessage: PropTypes.object.isRequired,
};
const mapStateToProps = state => ({
    projects: state.projects.allProjects,
});
const mapDispatchToProps = dispatch => ({ dispatch });
export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(DataSourceDialogComponent);
