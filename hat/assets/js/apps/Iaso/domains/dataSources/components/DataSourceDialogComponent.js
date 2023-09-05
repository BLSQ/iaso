import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Grid, Typography } from '@material-ui/core';

import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { merge } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { useGetProjectsDropdownOptions } from '../../projects/hooks/requests.ts';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../components/forms/InputComponent';
import MESSAGES from '../messages';
import { commaSeparatedIdsToArray } from '../../../utils/forms';
import { useFormState } from '../../../hooks/form';
import { useCheckDhis2Mutation, useSaveDataSource } from '../requests';

const ProjectSelectorIds = ({
    keyValue,
    value,
    onChange,
    errors,
    label,
    fieldHasBeenChanged,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: projects, isFetching } = useGetProjectsDropdownOptions();
    const allErrors = [...errors];
    if (value.length === 0 && fieldHasBeenChanged) {
        allErrors.unshift(formatMessage(MESSAGES.emptyProjectsError));
    }
    return (
        <InputComponent
            keyValue={keyValue}
            value={value}
            onChange={(key, newValue) =>
                onChange(key, commaSeparatedIdsToArray(newValue))
            }
            errors={allErrors}
            options={projects}
            label={label}
            loading={isFetching}
            type="select"
            multi
            required
        />
    );
};

ProjectSelectorIds.defaultProps = {
    errors: [],
};

ProjectSelectorIds.propTypes = {
    keyValue: PropTypes.string.isRequired,
    value: PropTypes.array.isRequired,
    onChange: PropTypes.func.isRequired,
    errors: PropTypes.array,
    label: PropTypes.any.isRequired,
    fieldHasBeenChanged: PropTypes.bool.isRequired,
};

const initialForm = (defaultSourceVersion, initialData, sourceCredentials) => {
    const values = {
        id: null,
        name: '',
        read_only: false,
        versions: [],
        description: '',
        project_ids: [],
        default_version_id: null,
        is_default_source: false,
        credentials: {
            dhis_name: '',
            dhis_url: '',
            dhis_login: '',
            dhis_password: '',
        },
    };

    if (initialData) {
        merge(values, {
            id: initialData.id,
            name: initialData.name,
            read_only: initialData.read_only,
            versions: initialData.versions,
            description: initialData.description,
            project_ids: initialData.projects?.map(p => p.id),
            default_version_id: initialData.default_version?.id,
            is_default_source:
                initialData.id === defaultSourceVersion?.source?.id,
            credentials: {
                dhis_name: sourceCredentials?.name,
                dhis_url: sourceCredentials?.url,
                dhis_login: sourceCredentials?.login,
                dhis_password: '',
            },
        });
    }
    return values;
};

const formIsValid = form => {
    return (
        form.project_ids?.value.length > 0 &&
        !(form.is_default_source.value && !form.default_version_id.value)
    );
};

export const DataSourceDialogComponent = ({
    defaultSourceVersion,
    initialData,
    onSuccess,
    renderTrigger,
    sourceCredentials,
}) => {
    const [form, setFieldValue, setFieldErrors, setFormState] = useFormState(
        initialForm(),
    );
    const { saveDataSource, isSaving } = useSaveDataSource(setFieldErrors);
    const checkDhis2 = useCheckDhis2Mutation(setFieldErrors);
    const [fieldHasBeenChanged, setFieldHasBeenChanged] = useState(false);
    const { formatMessage } = useSafeIntl();

    const onConfirm = async closeDialog => {
        await saveDataSource(form);
        // Notify parents to refetch. Remove if porting parent to react-query
        onSuccess();
        closeDialog();
    };

    const allowConfirm = formIsValid(form);

    const setCredentials = (credentialsField, credentialsFieldValue) => {
        const newCredentials = {
            ...form.credentials.value,
            [credentialsField]: credentialsFieldValue,
        };
        setFieldValue('credentials', newCredentials);
    };

    const onChangeProjects = useCallback(
        (keyValue, newValue) => {
            setFieldValue(keyValue, newValue);
            if (!fieldHasBeenChanged) {
                setFieldHasBeenChanged(true);
            }
        },
        [fieldHasBeenChanged, setFieldValue],
    );

    const versions = initialData?.versions?.map(v => ({
        label: v.number.toString(),
        value: v.id,
    }));

    return (
        <ConfirmCancelDialogComponent
            dataTestId="datasource-modal"
            renderTrigger={renderTrigger}
            titleMessage={
                initialData
                    ? MESSAGES.updateDataSource
                    : MESSAGES.createDataSource
            }
            onConfirm={closeDialog => onConfirm(closeDialog)}
            onOpen={() => {
                checkDhis2.reset();
                setFormState(
                    initialForm(
                        defaultSourceVersion,
                        initialData,
                        sourceCredentials,
                    ),
                );
            }}
            confirmMessage={MESSAGES.save}
            cancelMessage={MESSAGES.cancel}
            maxWidth="md"
            allowConfirm={allowConfirm}
        >
            {isSaving && <LoadingSpinner fixed={false} />}
            <Grid container spacing={2} justifyContent="flex-start">
                <Grid xs={6} item>
                    <InputComponent
                        keyValue="name"
                        onChange={setFieldValue}
                        value={form.name.value}
                        errors={form.name.errors}
                        type="text"
                        label={MESSAGES.dataSourceName}
                        required
                    />
                    <InputComponent
                        keyValue="description"
                        onChange={setFieldValue}
                        value={form.description.value}
                        errors={form.description.errors}
                        type="text"
                        label={MESSAGES.dataSourceDescription}
                        multiline
                    />
                    <Box>
                        <ProjectSelectorIds
                            keyValue="project_ids"
                            onChange={onChangeProjects}
                            value={form.project_ids.value}
                            errors={form.project_ids.error}
                            label={MESSAGES.projects}
                            fieldHasBeenChanged={fieldHasBeenChanged}
                        />
                    </Box>
                    {form.id.value && (
                        <InputComponent
                            multi={false}
                            clearable={!form.is_default_source.value}
                            required={form.is_default_source.value}
                            keyValue="default_version_id"
                            onChange={setFieldValue}
                            value={form.default_version_id.value}
                            errors={form.default_version_id.errors}
                            type="select"
                            options={initialData ? versions : []}
                            label={MESSAGES.defaultVersion}
                        />
                    )}
                    <Box>
                        <InputComponent
                            keyValue="read_only"
                            onChange={setFieldValue}
                            value={form.read_only.value}
                            errors={form.read_only.errors}
                            type="checkbox"
                            label={MESSAGES.dataSourceReadOnly}
                        />
                    </Box>
                    {form.id.value && (
                        <Box>
                            <InputComponent
                                keyValue="is_default_source"
                                // Only disable if it already is default source
                                disabled={
                                    initialData.id ===
                                    defaultSourceVersion?.source?.id
                                }
                                onChange={setFieldValue}
                                value={form.is_default_source.value}
                                errors={form.is_default_source.errors}
                                type="checkbox"
                                label={MESSAGES.defaultSource}
                            />
                        </Box>
                    )}
                </Grid>
                <Grid xs={6} item>
                    <InputComponent
                        value={form.credentials.value.dhis_name}
                        keyValue="dhis_name"
                        errors={form.credentials.errors}
                        label={MESSAGES.dhisName}
                        onChange={setCredentials}
                    />
                    <InputComponent
                        value={form.credentials.value.dhis_url}
                        keyValue="dhis_url"
                        errors={form.credentials_dhis2_url?.errors}
                        label={MESSAGES.dhisUrl}
                        onChange={setCredentials}
                    />
                    <InputComponent
                        value={form.credentials.value.dhis_login}
                        keyValue="dhis_login"
                        errors={form.credentials_dhis2_login?.errors}
                        label={MESSAGES.dhisLogin}
                        onChange={setCredentials}
                    />
                    <InputComponent
                        value={form.credentials.value.dhis_password}
                        keyValue="dhis_password"
                        errors={form.credentials_dhis2_password?.errors}
                        label={MESSAGES.dhisPassword}
                        onChange={setCredentials}
                        password
                    />
                    {checkDhis2.isLoading && <LoadingSpinner />}
                    <Button
                        onClick={() => checkDhis2.mutate(form)}
                        disabled={!form.credentials.value.dhis_url}
                    >
                        <FormattedMessage
                            id="iaso.label.checkDHIS"
                            defaultMessage="Test settings"
                        />
                    </Button>
                    <Typography>
                        {checkDhis2.isSuccess &&
                            `✅ ${formatMessage(MESSAGES.checkDhis2Success)}`}

                        {checkDhis2.isError &&
                            `❌ ${formatMessage(MESSAGES.checkDhis2Error)}`}
                    </Typography>
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};

DataSourceDialogComponent.defaultProps = {
    initialData: null,
    defaultSourceVersion: null,
    sourceCredentials: {},
};
DataSourceDialogComponent.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    initialData: PropTypes.object,
    renderTrigger: PropTypes.func.isRequired,
    defaultSourceVersion: PropTypes.object,
    sourceCredentials: PropTypes.object,
};

export default DataSourceDialogComponent;
