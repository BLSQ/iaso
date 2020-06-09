import React from 'react';
import {useDispatch} from 'react-redux';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';

import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../../components/forms/InputComponent';
import MESSAGES from '../messages';
import { saveOrgUnitType, createOrgUnitType } from '../actions';
import { useFormState } from '../../../../hooks/forms';

export default function OrgUnitTypesDialog({ titleMessage, renderTrigger, initialData }) {
    const [formState, setFieldValue, setFieldErrors] = useFormState(initialData);
    const dispatch = useDispatch();

    const onConfirm = (closeDialog) => {
        const saveFunction = initialData.id ? saveOrgUnitType(formState) : createOrgUnitType(formState);

        dispatch(saveFunction)
            .then(closeDialog)
            .catch((error) => {
                if (error.status === 400) {
                    Object.entries(error.details).forEach(setFieldErrors);
                }
            });
    };

    return (
        <ConfirmCancelDialogComponent
            titleMessage={titleMessage}
            onConfirm={onConfirm}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.save}
            renderTrigger={renderTrigger}
            maxWidth="sm"
        >
            <Grid container spacing={4} justify="flex-start">
                <Grid xs={12} item>
                    <InputComponent
                        keyValue="name"
                        onChange={setFieldValue}
                        value={formState.name.value}
                        errors={formState.name.errors}
                        type="text"
                        label={MESSAGES.name}
                        required
                    />
                </Grid>
                <Grid xs={12} item>
                    <InputComponent
                        keyValue="shortName"
                        onChange={setFieldValue}
                        value={formState.shortName.value}
                        errors={formState.shortName.errors}
                        type="text"
                        label={MESSAGES.shortName}
                        required={false}
                    />
                </Grid>
                <Grid xs={12} item>
                    <InputComponent
                        keyValue="depth"
                        onChange={setFieldValue}
                        value={formState.depth.value}
                        errors={formState.shortName.errors}
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
                        onChange={setFieldValue}
                        value={formState.subUnitTypes.value.length > 0 ? formState.subUnitTypes.value.map(ot => ot.id) : null}
                        type="select"
                        options={[].map(ot => ({
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
OrgUnitTypesDialog.propTypes = {
    titleMessage: PropTypes.object.isRequired,
    renderTrigger: PropTypes.func.isRequired,
    initialData: PropTypes.object,
};
OrgUnitTypesDialog.defaultProps = {
    initialData: {
        name: '',
        shortName: '',
        subUnitTypes: [],
        depth: null,
    },
};
