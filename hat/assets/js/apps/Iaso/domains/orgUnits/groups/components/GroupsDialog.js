import React, { Component } from 'react';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import { bindActionCreators } from 'redux';

import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../../components/forms/InputComponent';

import {
    saveGroup as saveGroupAction,
    fetchGroups as fetchGroupsAction,
    createGroup as createGroupAction,
} from '../actions';

class UserDialogComponent extends Component {
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
        const {
            params,
            fetchGroups,
            saveGroup,
            createGroup,
            initialData,
        } = this.props;
        const currentGroup = {};
        Object.keys(this.state).forEach((key) => {
            currentGroup[key] = this.state[key].value;
        });

        let saveGroupTemp;

        if (initialData) {
            saveGroupTemp = saveGroup(currentGroup);
        } else {
            saveGroupTemp = createGroup(currentGroup);
        }
        saveGroupTemp.then((newGroup) => {
            closeDialog();
            this.setState(this.initialState(newGroup));
            fetchGroups(params);
        })
            .catch((error) => {
                console.log('error', error);
                if (error.status === 400) {
                    this.setFieldErrors(error.details.errorKey, error.details.errorMessage);
                }
            });
    }

    setFieldValue(fieldName, fieldValue) {
        this.setState({ [fieldName]: { value: fieldValue, errors: [] } });
    }

    setFieldErrors(fieldName, fieldError) {
        this.setState({ [fieldName]: { value: this.state[fieldName].value, errors: [fieldError] } });
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
        };
    }

    render() {
        const {
            titleMessage, renderTrigger, initialData,
        } = this.props;
        return (
            <ConfirmCancelDialogComponent
                titleMessage={titleMessage}
                onConfirm={closeDialog => this.onConfirm(closeDialog)}
                cancelMessage={{ id: 'iaso.label.cancel', defaultMessage: 'Cancel' }}
                confirmMessage={{ id: 'iaso.label.save', defaultMessage: 'Save' }}
                onClosed={() => this.setState(this.initialState())}
                renderTrigger={renderTrigger}
                maxWidth="md"
            >
                <Grid container spacing={4} justify="flex-start">
                    <Grid xs={6} item>
                        <InputComponent
                            keyValue="name"
                            onChange={(key, value) => this.setFieldValue(key, value)}
                            value={this.state.name.value}
                            errors={this.state.name.errors}
                            type="text"
                            label={{
                                defaultMessage: 'Name',
                                id: 'iaso.label.name',
                            }}
                            required
                        />
                    </Grid>
                </Grid>
            </ConfirmCancelDialogComponent>
        );
    }
}

UserDialogComponent.defaultProps = {
    initialData: null,
};

UserDialogComponent.propTypes = {
    titleMessage: PropTypes.object.isRequired,
    renderTrigger: PropTypes.func.isRequired,
    initialData: PropTypes.object,
    fetchGroups: PropTypes.func.isRequired,
    saveGroup: PropTypes.func.isRequired,
    createGroup: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
};


const MapStateToProps = state => ({
    groups: state.groups.list,
    count: state.groups.count,
    pages: state.groups.pages,
    fetching: state.groups.fetching,
});

const mapDispatchToProps = dispatch => (
    {
        ...bindActionCreators({
            fetchGroups: fetchGroupsAction,
            saveGroup: saveGroupAction,
            createGroup: createGroupAction,
        }, dispatch),
    }
);
export default connect(MapStateToProps, mapDispatchToProps)(UserDialogComponent);
