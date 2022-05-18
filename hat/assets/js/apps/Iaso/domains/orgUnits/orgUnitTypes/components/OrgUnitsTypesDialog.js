import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Box } from '@material-ui/core';

import { useSafeIntl } from 'bluesquare-components';

import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../../components/forms/InputComponent';
import MESSAGES from '../messages';
import {
    saveOrgUnitType as saveOrgUnitTypeAction,
    createOrgUnitType as createOrgUnitTypeAction,
} from '../actions';
import { useFormState } from '../../../../hooks/form';
import {
    commaSeparatedIdsToArray,
    isFieldValid,
    isFormValid,
} from '../../../../utils/forms';
import { requiredFields } from '../config/requiredFields';

export default function OrgUnitsTypesDialog({
    orgUnitType,
    titleMessage,
    onConfirmed,
    ...dialogProps
}) {
    const dispatch = useDispatch();
    const { formatMessage } = useSafeIntl();

    const { allOrgUnitTypes, allProjects } = useSelector(state => ({
        allOrgUnitTypes: state.orgUnitsTypes.allTypes || [],
        allProjects: state.projects.allProjects || [],
    }));

    const [formState, setFieldValue, setFieldErrors, setFormState] =
        useFormState({
            id: orgUnitType.id,
            name: orgUnitType.name,
            short_name: orgUnitType.short_name,
            project_ids: orgUnitType.projects.map(project => project.id),
            depth: orgUnitType.depth,
            sub_unit_type_ids: orgUnitType.sub_unit_types.map(unit => unit.id),
        });

    const onChange = useCallback(
        (keyValue, value) => {
            if (
                keyValue === 'sub_unit_type_ids' ||
                keyValue === 'project_ids'
            ) {
                setFieldValue(keyValue, commaSeparatedIdsToArray(value));
            } else {
                setFieldValue(keyValue, value);
            }

            if (!isFieldValid(keyValue, value, requiredFields)) {
                setFieldErrors(keyValue, [
                    formatMessage(MESSAGES.requiredField),
                ]);
            }
        },
        [setFieldValue, setFieldErrors, formatMessage],
    );

    const onConfirm = useCallback(
        closeDialog => {
            const savePromise =
                orgUnitType.id === null
                    ? dispatch(createOrgUnitTypeAction(formState))
                    : dispatch(saveOrgUnitTypeAction(formState));

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

    const resetForm = () => {
        setFormState({
            id: null,
            name: '',
            short_name: '',
            project_ids: [],
            depth: null,
            sub_unit_type_ids: [],
        });
    };

    const subUnitTypes = allOrgUnitTypes.filter(
        subUnit => subUnit.id !== formState.id.value,
    );

    return (
        <ConfirmCancelDialogComponent
            id="OuTypes-modal"
            titleMessage={titleMessage}
            onConfirm={onConfirm}
            onCancel={closeDialog => {
                closeDialog();
                resetForm();
            }}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.save}
            allowConfirm={isFormValid(requiredFields, formState)}
            {...dialogProps}
        >
            <Box pt={2} pb={2}>
                <InputComponent
                    keyValue="name"
                    onChange={onChange}
                    value={formState.name.value}
                    errors={formState.name.errors}
                    type="text"
                    label={MESSAGES.name}
                    required
                />
            </Box>
            <Box pt={2} pb={2}>
                <InputComponent
                    keyValue="short_name"
                    onChange={onChange}
                    value={formState.short_name.value}
                    errors={formState.short_name.errors}
                    type="text"
                    label={MESSAGES.shortName}
                    required
                />
            </Box>

            <Box pt={2} pb={2}>
                <InputComponent
                    multi
                    clearable
                    keyValue="project_ids"
                    onChange={onChange}
                    value={formState.project_ids.value}
                    errors={formState.project_ids.errors}
                    type="select"
                    options={
                        allProjects?.map(p => ({
                            label: p.name,
                            value: p.id,
                        })) ?? []
                    }
                    label={MESSAGES.projects}
                    required
                />
            </Box>

            <Box pt={2} pb={2}>
                <InputComponent
                    keyValue="depth"
                    onChange={onChange}
                    value={formState.depth.value}
                    errors={formState.depth.errors}
                    type="number"
                    label={MESSAGES.depth}
                    required
                />
            </Box>

            <Box pt={2} pb={2}>
                <InputComponent
                    multi
                    clearable
                    keyValue="sub_unit_type_ids"
                    onChange={onChange}
                    value={formState.sub_unit_type_ids.value}
                    errors={formState.sub_unit_type_ids.errors}
                    type="select"
                    options={subUnitTypes.map(orgunitType => ({
                        value: orgunitType.id,
                        label: orgunitType.name,
                    }))}
                    label={MESSAGES.subUnitTypes}
                />
            </Box>
        </ConfirmCancelDialogComponent>
    );
}
OrgUnitsTypesDialog.propTypes = {
    orgUnitType: PropTypes.object,
    titleMessage: PropTypes.object.isRequired,
    renderTrigger: PropTypes.func.isRequired,
    onConfirmed: PropTypes.func.isRequired,
};
OrgUnitsTypesDialog.defaultProps = {
    orgUnitType: {
        id: null,
        name: '',
        short_name: '',
        projects: [],
        depth: 0,
        sub_unit_types: [],
    },
};
