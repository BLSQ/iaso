import React, { Component } from 'react';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import { bindActionCreators } from 'redux';

import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../../components/forms/InputComponent';

import MESSAGES from '../messages';

import {
    saveGroup as saveGroupAction,
    fetchGroups as fetchGroupsAction,
    createGroup as createGroupAction,
} from '../actions';

class GroupDialogComponent extends Component {
    constructor(props) {
        super(props);

        this.state = this.initialState();
    }

    componentDidUpdate(prevProps) {
        if (!isEqual(prevProps.initialData, this.props.initialData)) {
            this.setInitialState();
        }
    }

    onConfirm(closeDialog) {
        const { params, fetchGroups, saveGroup, createGroup, initialData } =
            this.props;
        const currentGroup = {};
        Object.keys(this.state).forEach(key => {
            currentGroup[key] = this.state[key].value;
        });

        let saveGroupTemp;

        if (initialData) {
            saveGroupTemp = saveGroup(currentGroup);
        } else {
            saveGroupTemp = createGroup(currentGroup);
        }
        saveGroupTemp
            .then(newGroup => {
                closeDialog();
                this.setState(this.initialState(newGroup));
                fetchGroups(params);
            })
            .catch(error => {
                if (error.status === 400) {
                    Object.entries(error.details).forEach(
                        ([errorKey, errorMessages]) => {
                            this.setFieldErrors(errorKey, errorMessages);
                        },
                    );
                }
            });
    }

    setFieldValue(fieldName, fieldValue) {
        this.setState({ [fieldName]: { value: fieldValue, errors: [] } });
    }

    setFieldErrors(fieldName, fieldErrors) {
        this.setState({
            [fieldName]: {
                value: this.state[fieldName].value,
                errors: fieldErrors,
            },
        });
    }

    setInitialState() {
        this.setState(this.initialState());
    }

    initialState(group) {
        let initialData = this.props.initialData ? this.props.initialData : {};
        if (group) {
            initialData = group;
        }
        return {
            id: { value: get(initialData, 'id', null), errors: [] },
            name: { value: get(initialData, 'name', ''), errors: [] },
            source_ref: {
                value: get(initialData, 'source_ref', ''),
                errors: [],
            },
        };
    }

    render() {
        const { titleMessage, renderTrigger } = this.props;

        return (
            <ConfirmCancelDialogComponent
                dataTestId="groups-dialog"
                titleMessage={titleMessage}
                onConfirm={closeDialog => this.onConfirm(closeDialog)}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.save}
                onClosed={() => this.setState(this.initialState())}
                renderTrigger={renderTrigger}
                maxWidth="sm"
            >
                <Grid container spacing={4} justifyContent="flex-start">
                    <Grid xs={12} item>
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
                        <InputComponent
                            keyValue="source_ref"
                            onChange={(key, value) =>
                                this.setFieldValue(key, value)
                            }
                            value={this.state.source_ref.value}
                            errors={this.state.source_ref.errors}
                            type="text"
                            label={MESSAGES.sourceRef}
                        />
                    </Grid>
                </Grid>
            </ConfirmCancelDialogComponent>
        );
    }
}

GroupDialogComponent.defaultProps = {
    initialData: null,
};

GroupDialogComponent.propTypes = {
    titleMessage: PropTypes.object.isRequired,
    renderTrigger: PropTypes.func.isRequired,
    initialData: PropTypes.object,
    fetchGroups: PropTypes.func.isRequired,
    saveGroup: PropTypes.func.isRequired,
    createGroup: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    count: state.groups.count,
    pages: state.groups.pages,
    fetching: state.groups.fetching,
});

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            fetchGroups: fetchGroupsAction,
            saveGroup: saveGroupAction,
            createGroup: createGroupAction,
        },
        dispatch,
    ),
});
export default connect(
    MapStateToProps,
    mapDispatchToProps,
)(GroupDialogComponent);
