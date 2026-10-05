import React, { useState, useCallback, FunctionComponent } from 'react';
import {
    Alert,
    AlertTitle,
    Box,
    Button,
    Grid,
    List,
    ListItem,
    Typography,
} from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { merge } from 'lodash';
import { FormattedMessage } from 'react-intl';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../components/forms/InputComponent';
import { useFormState } from '../../../hooks/form';
import { commaSeparatedIdsToArray } from '../../../utils/forms';
import * as Permission from '../../../utils/permissions';
import { useGetProjectsDropdownOptions } from '../../projects/hooks/requests';
import {
    useCurrentUserHasPermission,
    useCurrentUserHasAccessToModule,
} from '../../users/utils';
import { useTranslatedDhis2Errors } from '../hooks/useTranslatedDhis2Errors';
import MESSAGES from '../messages';
import { useCheckDhis2Mutation, useSaveDataSource } from '../requests';

type SelectorProps = {
    keyValue: string;
    value: any[];
    onChange: (key: string, value: number[]) => void;
    label: any;
    fieldHasBeenChanged: boolean;
    errors?: any[];
};

const ProjectSelectorIds: FunctionComponent<SelectorProps> = ({
    keyValue,
    value,
    onChange,
    errors = [],
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

const initialForm = (
    defaultSourceVersion?: any,
    initialData?: any,
    sourceCredentials?: any,
) => {
    const values = {
        id: null,
        name: '',
        read_only: false,
        versions: [],
        description: '',
        project_ids: [],
        default_version_id: null,
        is_default_source: false,
        confirm_default_version_change: false,
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

const formIsValid = (form, willChangeDefaultVersion = false) => {
    return (
        form.project_ids?.value.length > 0 &&
        !(form.is_default_source.value && !form.default_version_id.value) &&
        // changing the account default version must be explicitly confirmed
        !(
            willChangeDefaultVersion &&
            !form.confirm_default_version_change.value
        )
    );
};

type Props = {
    renderTrigger: ({
        openDialog,
    }: {
        openDialog: () => void;
    }) => React.JSX.Element;
    defaultSourceVersion?: Record<string, any>;
    sourceCredentials?: Record<string, any>;
    initialData?: Record<string, any>;
};

export const DataSourceDialogComponent: FunctionComponent<Props> = ({
    defaultSourceVersion,
    initialData,
    renderTrigger,
    sourceCredentials = {},
}) => {
    const [form, setFieldValue, setFieldErrors, setFormState] =
        useFormState(initialForm());
    const { saveDataSource, isSaving } = useSaveDataSource(setFieldErrors);
    const checkDhis2 = useCheckDhis2Mutation(setFieldErrors);
    const [fieldHasBeenChanged, setFieldHasBeenChanged] = useState(false);
    const { formatMessage } = useSafeIntl();

    const userCanChangeDefaultVersion = useCurrentUserHasPermission(
        Permission.SOURCES_CAN_CHANGE_DEFAULT_VERSION,
    );
    const hasDhis2Module = useCurrentUserHasAccessToModule('DHIS2_MAPPING');
    const onConfirm = async closeDialog => {
        await saveDataSource(form);
        closeDialog();
    };

    // The account default version changes when this source is (or becomes) the default source
    // and the selected version differs from the account's current default version.
    const willChangeDefaultVersion = Boolean(
        form.is_default_source.value &&
        form.default_version_id.value &&
        form.default_version_id.value !== defaultSourceVersion?.version?.id,
    );

    const allowConfirm = formIsValid(form, willChangeDefaultVersion);

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

    const urlErrors = useTranslatedDhis2Errors(form.credentials_dhis2_url);
    const userPasswordErrors = useTranslatedDhis2Errors(
        form.credentials_dhis2_password,
    );
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
            maxWidth={hasDhis2Module ? 'md' : 'sm'}
            allowConfirm={allowConfirm}
        >
            {isSaving && <LoadingSpinner fixed={false} />}
            <Grid container spacing={2} justifyContent="flex-start">
                <Grid xs={hasDhis2Module ? 6 : 12} item>
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
                            disabled={!userCanChangeDefaultVersion}
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

                {hasDhis2Module && (
                    <Grid xs={6} item>
                        <InputComponent
                            value={form.credentials.value.dhis_name}
                            keyValue="dhis_name"
                            errors={form.credentials.errors}
                            label={MESSAGES.dhisName}
                            onChange={setCredentials}
                            type="text"
                        />
                        <InputComponent
                            value={form.credentials.value.dhis_url}
                            keyValue="dhis_url"
                            errors={urlErrors}
                            label={MESSAGES.dhisUrl}
                            onChange={setCredentials}
                            type="text"
                        />
                        <InputComponent
                            value={form.credentials.value.dhis_login}
                            keyValue="dhis_login"
                            errors={form.credentials_dhis2_login?.errors}
                            label={MESSAGES.dhisLogin}
                            onChange={setCredentials}
                            type="text"
                        />
                        <InputComponent
                            value={form.credentials.value.dhis_password}
                            keyValue="dhis_password"
                            errors={userPasswordErrors}
                            label={MESSAGES.dhisPassword}
                            onChange={setCredentials}
                            type="password"
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
                )}

                {willChangeDefaultVersion && (
                    <Grid xs={12} item>
                        <Alert severity="warning">
                            <AlertTitle>
                                {formatMessage(
                                    MESSAGES.changeDefaultVersionWarningTitle,
                                )}
                            </AlertTitle>
                            <List
                                sx={{
                                    m: 0,
                                    pl: '1.2em',
                                    listStyleType: 'disc',
                                }}
                            >
                                {[
                                    MESSAGES.changeDefaultVersionWarningPastData,
                                    MESSAGES.changeDefaultVersionWarningGroups,
                                    MESSAGES.changeDefaultVersionWarningUsers,
                                    MESSAGES.changeDefaultVersionWarningPlanning,
                                    MESSAGES.changeDefaultVersionWarningReferences,
                                    MESSAGES.changeDefaultVersionWarningSavedViews,
                                    MESSAGES.changeDefaultVersionWarningOther,
                                ].map(message => (
                                    <ListItem
                                        key={message.id}
                                        sx={{
                                            display: 'list-item',
                                            p: 0,
                                        }}
                                    >
                                        {formatMessage(message)}
                                    </ListItem>
                                ))}
                            </List>
                            <InputComponent
                                keyValue="confirm_default_version_change"
                                onChange={setFieldValue}
                                value={
                                    form.confirm_default_version_change.value
                                }
                                errors={
                                    form.confirm_default_version_change.errors
                                }
                                type="checkbox"
                                label={MESSAGES.changeDefaultVersionConfirm}
                                withMarginTop={false}
                            />
                        </Alert>
                    </Grid>
                )}
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};

export default DataSourceDialogComponent;
