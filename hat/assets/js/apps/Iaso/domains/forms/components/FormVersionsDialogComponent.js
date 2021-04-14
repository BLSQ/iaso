import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';

import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../components/forms/InputComponent';
import FileInputComponent from '../../../components/forms/FileInputComponent';
import MESSAGES from '../messages';
import { createFormVersion } from '../../../utils/requests';
import { useFormState } from '../../../hooks/form';
import { commaSeparatedIdsToArray } from '../../../utils/forms';

const FormVersionsDialogComponent = ({
    formVersion,
    titleMessage,
    onConfirmed,
    ...dialogProps
}) => {
    const dispatch = useDispatch();
    const { allOrgUnitTypes, allProjects } = useSelector(state => ({
        allOrgUnitTypes: state.orgUnitsTypes.allTypes || [],
        allProjects: state.projects.allProjects || [],
    }));

    const [formState, setFieldValue, setFieldErrors] = useFormState({
        id: formVersion.id,
        start_period: formVersion.start_period,
        end_period: formVersion.short_name,
        version_id: formVersion.version_id,
        xls_file: formVersion.xls_file,
    });

    const onConfirm = useCallback(
        closeDialog => {
            const savePromise =
                formVersion.id === null
                    ? createFormVersion(formState)
                    : () => null;

            savePromise
                .then(() => {
                    closeDialog();
                    onConfirmed();
                })
                .catch(error => {
                    if (error.status === 400) {
                        Object.entries(error.details).forEach(entry =>
                            setFieldErrors(entry[0], entry[1]),
                        );
                    }
                });
        },
        [dispatch, setFieldErrors, formState],
    );

    const subUnitTypes = allOrgUnitTypes.filter(
        s => s.id !== formState.id.value,
    );
    console.log('formState', formState);
    return (
        <ConfirmCancelDialogComponent
            titleMessage={titleMessage}
            onConfirm={onConfirm}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.save}
            {...dialogProps}
        >
            <Grid container spacing={4} justify="flex-start">
                <Grid xs={12} item>
                    <InputComponent
                        keyValue="version_id"
                        onChange={setFieldValue}
                        value={formState.version_id.value}
                        errors={formState.version_id.errors}
                        type="text"
                        label={MESSAGES.version}
                        required
                    />
                    <FileInputComponent
                        keyValue="xls_file"
                        onChange={setFieldValue}
                        value={formState.xls_file.value}
                        label={MESSAGES.xls_form_file}
                        errors={formState.xls_file.errors}
                        required
                    />
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};

FormVersionsDialogComponent.defaultProps = {
    formVersion: {
        id: null,
        start_period: null,
        end_period: null,
        version_id: null,
    },
};

FormVersionsDialogComponent.propTypes = {
    formVersion: PropTypes.object,
    titleMessage: PropTypes.object.isRequired,
    renderTrigger: PropTypes.func.isRequired,
    onConfirmed: PropTypes.func.isRequired,
};
export default FormVersionsDialogComponent;
