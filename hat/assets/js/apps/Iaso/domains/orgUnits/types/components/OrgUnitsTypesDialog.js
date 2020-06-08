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
    fetchOrgUnitTypes as fetchOrgUnitTypesAction,
    saveOrgUnitType as saveOrgUnitTypeAction,
    createOrgUnitType as createOrgUnitTypeAction,
} from '../actions';

class OrgUnitsTypesDialogComponent extends Component {
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
            fetchOrgUnitTypes,
            saveOrgUnitType,
            createOrgUnitType,
            initialData,
        } = this.props;
        const currentOrgUnit = {};
        Object.keys(this.state).forEach((key) => {
            currentOrgUnit[key] = this.state[key].value;
        });
        currentOrgUnit.short_name = currentOrgUnit.shortName;
        currentOrgUnit.sub_unit_types = currentOrgUnit.subUnitTypes;
        currentOrgUnit.sub_unit_type_ids = currentOrgUnit.subUnitTypes.map(s => s.id);
        delete currentOrgUnit.shortName;
        delete currentOrgUnit.subUnitTypes;
        let saveOrgUnitTypeTemp;

        if (initialData) {
            saveOrgUnitTypeTemp = saveOrgUnitType(currentOrgUnit);
        } else {
            saveOrgUnitTypeTemp = createOrgUnitType(currentOrgUnit);
        }
        saveOrgUnitTypeTemp.then((newOrgUnitType) => {
            closeDialog();
            this.setState(this.initialState(newOrgUnitType));
            fetchOrgUnitTypes(params);
        })
            .catch((error) => {
                if (error.status === 400) {
                    Object.entries(error.details).forEach(([errorKey, errorMessages]) => {
                        this.setFieldErrors(errorKey, errorMessages);
                    });
                }
            });
    }

    setFieldValue(fieldName, fieldValue) {
        this.setState({ [fieldName]: { value: fieldValue, errors: [] } });
    }

    setFieldErrors(fieldName, fieldErrors) {
        this.setState({ [fieldName]: { value: this.state[fieldName].value, errors: fieldErrors } });
    }


    setSubUnitTypes(newSubUniTypes) {
        this.setState({
            subUnitTypes: {
                value: newSubUniTypes.split(',').map(s => ({ id: s })),
                errors: [],
            },
        });
    }

    setInitialState() {
        this.setState(this.initialState());
    }

    initialState(orgUnitType) {
        let initialData = this.props.initialData ? this.props.initialData : {};
        if (orgUnitType) {
            initialData = orgUnitType;
        }
        return {
            id: { value: get(initialData, 'id', null), errors: [] },
            name: { value: get(initialData, 'name', ''), errors: [] },
            shortName: { value: get(initialData, 'short_name', ''), errors: [] },
            subUnitTypes: { value: get(initialData, 'sub_unit_types', []), errors: [] },
            depth: { value: get(initialData, 'depth', ''), errors: [] },
        };
    }

    render() {
        const {
            titleMessage, renderTrigger, orgUnitsTypes,
        } = this.props;
        const {
            id,
            name,
            shortName,
            depth,
            subUnitTypes,
        } = this.state;
        const subUnitTypesList = orgUnitsTypes.filter(s => s.id !== id.value);
        return (
            <ConfirmCancelDialogComponent
                titleMessage={titleMessage}
                onConfirm={closeDialog => this.onConfirm(closeDialog)}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.save}
                onClosed={() => this.setState(this.initialState())}
                renderTrigger={renderTrigger}
                maxWidth="sm"
            >
                <Grid container spacing={4} justify="flex-start">
                    <Grid xs={12} item>
                        <InputComponent
                            keyValue="name"
                            onChange={(key, value) => this.setFieldValue(key, value)}
                            value={name.value}
                            errors={name.errors}
                            type="text"
                            label={MESSAGES.name}
                            required
                        />
                    </Grid>
                    <Grid xs={12} item>
                        <InputComponent
                            keyValue="shortName"
                            onChange={(key, value) => this.setFieldValue(key, value)}
                            value={shortName.value}
                            errors={shortName.errors}
                            type="text"
                            label={MESSAGES.shortName}
                            required={false}
                        />
                    </Grid>
                    <Grid xs={12} item>
                        <InputComponent
                            keyValue="depth"
                            onChange={(key, value) => this.setFieldValue(key, value)}
                            value={depth.value}
                            errors={shortName.errors}
                            type="number"
                            label={MESSAGES.depth}
                            required={false}
                        />
                    </Grid>
                    <Grid xs={12} item>
                        <InputComponent
                            multi
                            clearable
                            keyValue="subUnitTypes"
                            onChange={(key, value) => this.setSubUnitTypes(value)}
                            value={subUnitTypes.value.length > 0 ? subUnitTypes.value.map(ot => ot.id) : null}
                            type="select"
                            options={subUnitTypesList.map(ot => ({
                                label: ot.name,
                                value: ot.id,
                            }))}
                            label={MESSAGES.subUnitTypes}
                        />
                    </Grid>
                </Grid>
            </ConfirmCancelDialogComponent>
        );
    }
}

OrgUnitsTypesDialogComponent.defaultProps = {
    initialData: null,
};

OrgUnitsTypesDialogComponent.propTypes = {
    titleMessage: PropTypes.object.isRequired,
    renderTrigger: PropTypes.func.isRequired,
    initialData: PropTypes.object,
    fetchOrgUnitTypes: PropTypes.func.isRequired,
    saveOrgUnitType: PropTypes.func.isRequired,
    createOrgUnitType: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    orgUnitsTypes: PropTypes.array.isRequired,
};


const MapStateToProps = state => ({
    orgUnitsTypes: state.orgUnitsTypes.allTypes,
    count: state.orgUnitsTypes.count,
    pages: state.orgUnitsTypes.pages,
    fetching: state.orgUnitsTypes.fetching,
});

const mapDispatchToProps = dispatch => (
    {
        ...bindActionCreators({
            fetchOrgUnitTypes: fetchOrgUnitTypesAction,
            saveOrgUnitType: saveOrgUnitTypeAction,
            createOrgUnitType: createOrgUnitTypeAction,
        }, dispatch),
    }
);
export default connect(MapStateToProps, mapDispatchToProps)(OrgUnitsTypesDialogComponent);
