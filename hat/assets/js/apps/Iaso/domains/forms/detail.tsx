import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { Box, Button, Tab, Tabs } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    LoadingSpinner,
    commonStyles,
    useGoBack,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import isEqual from 'lodash/isEqual';
import mapValues from 'lodash/mapValues';
import { useQueryClient } from 'react-query';
import { FormPredefinedFilters } from 'Iaso/domains/forms/components/FormPredefinedFilters';
import { isApiError400 } from 'Iaso/libs/Api';
import TopBar from '../../components/nav/TopBarComponent';
import { openSnackBar } from '../../components/snackBars/EventDispatcher';
import { succesfullSnackBar } from '../../constants/snackBars';
import { baseUrls } from '../../constants/urls';
import { useFormState } from '../../hooks/form.js';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { isFieldValid, isFormValid } from '../../utils/forms';
import { NO_PERIOD } from '../periods/constants';
import { FormAttachments } from './components/FormAttachments';
import FormForm from './components/FormFormComponent';
import FormVersions from './components/FormVersionsComponent';
import { requiredFields } from './config/index';
import { CR_MODE_NONE } from './constants';
import MESSAGES from './messages';
import { createForm, updateForm, useGetForm } from './requests';
import { FormDataType, FormParams, FormWritePayload } from './types/forms';

const useStyles = makeStyles(theme => ({
    ...(commonStyles(theme) as unknown as Record<string, any>),
    tabs: {
        ...(commonStyles(theme).tabs as unknown as Record<string, any>),
        padding: 0,
    },
}));

const defaultForm = {
    id: null,
    name: '',
    short_name: '',
    depth: null,
    org_unit_type_ids: [],
    org_unit_group_ids: [],
    project_ids: [],
    period_type: null,
    derived: false,
    single_per_period: false,
    periods_before_allowed: 0,
    periods_after_allowed: 0,
    device_field: 'deviceid',
    location_field: '',
    possible_fields: [],
    label_keys: [],
    legend_threshold: null,
    change_request_mode: CR_MODE_NONE,
    validation_workflow: null,
};

// Detail API payload is wider than `Form` (short_name, nested relations, etc.).
const formatFormData = (value?: Record<string, any> | null) => {
    let form = value;
    if (!form) form = defaultForm;
    return {
        id: form.id,
        name: form.name,
        short_name: form.short_name,
        depth: form.depth,
        org_unit_type_ids: form.org_unit_types
            ? form.org_unit_types.map((ot: any) => ot.id)
            : [],
        org_unit_group_ids: form.org_unit_groups
            ? form.org_unit_groups.map((g: any) => g.id)
            : [],
        project_ids: form.projects ? form.projects.map((p: any) => p.id) : [],
        period_type:
            form.period_type && form.period_type !== ''
                ? form.period_type
                : undefined,
        derived: form.derived,
        single_per_period: form.single_per_period,
        periods_before_allowed: form.periods_before_allowed,
        periods_after_allowed: form.periods_after_allowed,
        device_field: form.device_field,
        location_field: form.location_field,
        possible_fields: form.possible_fields ?? defaultForm.possible_fields,
        label_keys: form.label_keys ?? defaultForm.label_keys,
        legend_threshold: form.legend_threshold,
        change_request_mode: form.change_request_mode,
        validation_workflow: form.validation_workflow,
    };
};

const getFormWritePayload = (formState: FormDataType): FormWritePayload => ({
    id: formState.id.value,
    name: formState.name.value,
    short_name: formState.short_name.value,
    depth: formState.depth.value,
    org_unit_type_ids: formState.org_unit_type_ids.value,
    org_unit_group_ids: formState.org_unit_group_ids.value,
    project_ids: formState.project_ids.value,
    period_type: formState.period_type.value,
    derived: formState.derived.value,
    single_per_period: formState.single_per_period.value,
    periods_before_allowed: formState.periods_before_allowed.value,
    periods_after_allowed: formState.periods_after_allowed.value,
    device_field: formState.device_field.value,
    location_field: formState.location_field.value,
    label_keys: formState.label_keys.value,
    legend_threshold: formState.legend_threshold?.value,
    change_request_mode: formState.change_request_mode.value,
    validation_workflow: formState.validation_workflow?.value,
});

const FormDetail: FunctionComponent = () => {
    const params = useParamsObject(
        baseUrls.formDetail,
    ) as unknown as FormParams;
    const goBack = useGoBack(baseUrls.forms);
    const queryClient = useQueryClient();
    const { data: form, isLoading: isFormLoading } = useGetForm(
        params.formId,
        Boolean(params.formId) && params.formId !== '0',
        [
            'id',
            'name',
            'org_unit_types',
            'org_unit_groups',
            'projects',
            'period_type',
            'derived',
            'single_per_period',
            'periods_before_allowed',
            'periods_after_allowed',
            'device_field',
            'location_field',
            'label_keys',
            'possible_fields',
            'legend_threshold',
            'change_request_mode',
            'validation_workflow',
        ].join(','),
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [tab, setTab] = useState(params.tab || 'versions');
    const redirectToReplace = useRedirectToReplace();
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const [currentForm, setFieldValue, setFieldErrors, setFormState] =
        useFormState(formatFormData(form));
    const isFormModified = useMemo(() => {
        return (
            !isEqual(
                mapValues(currentForm, v => v.value),
                formatFormData(form),
            ) && !isSaved
        );
    }, [currentForm, form, isSaved]);

    const detailRequiredFields = useMemo(() => {
        if (
            currentForm.period_type.value === NO_PERIOD ||
            !currentForm.period_type.value
        ) {
            return requiredFields.filter(
                field => field.key !== 'single_per_period',
            );
        }
        return requiredFields;
    }, [currentForm.period_type.value]);
    const isNew = params.formId === '0';
    const onConfirm = async () => {
        const formData = getFormWritePayload(currentForm);
        let isUpdate = false;
        let saveForm;

        if (isNew) {
            saveForm = createForm(formData);
        } else {
            const formId: number | null = currentForm.id.value;
            if (formId === null) {
                return;
            }
            isUpdate = true;
            saveForm = updateForm(formId, formData);
        }
        setIsLoading(true);
        let savedFormData;
        try {
            savedFormData = await saveForm;
            queryClient.invalidateQueries(['forms']);
            openSnackBar(succesfullSnackBar());

            if (!isUpdate) {
                redirectToReplace(baseUrls.formDetail, {
                    formId: String(savedFormData.id),
                });
            }
        } catch (error: unknown) {
            if (!isApiError400(error)) {
                return;
            }
            Object.entries(error.details).forEach(
                ([errorKey, errorMessages]) => {
                    setFieldErrors(errorKey, errorMessages);
                },
            );
        } finally {
            setIsLoading(false);
            setIsSaved(true);
        }
    };

    const handleReset = useCallback(() => {
        setFormState(formatFormData(form));
    }, [form, setFormState]);

    const onChange = useCallback(
        (keyValue: string, value: any) => {
            if (isSaved) setIsSaved(false);
            setFieldValue(keyValue, value);
            if (!isFieldValid(keyValue, value, detailRequiredFields)) {
                setFieldErrors(keyValue, [
                    formatMessage(MESSAGES.requiredField),
                ]);
            }
        },
        [
            isSaved,
            setFieldValue,
            detailRequiredFields,
            setFieldErrors,
            formatMessage,
        ],
    );

    const handleCancel = useCallback(
        () => (isNew ? goBack() : handleReset()),
        [goBack, handleReset, isNew],
    );

    const handleChangeTab = (newTab: string) => {
        setTab(newTab);
        const newParams = {
            ...params,
            tab: newTab,
        };
        redirectToReplace(baseUrls.formDetail, newParams);
    };
    useEffect(() => {
        if (form) {
            setFormState(formatFormData(form));
        }
    }, [form, setFormState]);

    const originalSinglePerPeriod = useMemo(() => {
        let singlePerPeriodValue = false;
        if (form) {
            singlePerPeriodValue = form.period_type
                ? form.single_per_period
                : false;
        }
        return singlePerPeriodValue;
    }, [form]);
    return (
        <>
            <TopBar
                title={`${formatMessage(MESSAGES.detailTitle)}: ${
                    currentForm.name.value
                }`}
                displayBackButton
                goBack={() => goBack()}
            />
            {(isLoading || isFormLoading) && <LoadingSpinner />}
            <Box className={classes.containerFullHeightNoTabPadded}>
                <FormForm
                    currentForm={currentForm}
                    setFieldValue={onChange}
                    originalSinglePerPeriod={originalSinglePerPeriod}
                />
                <Box mt={2} justifyContent="flex-end" display="flex">
                    {currentForm.id.value !== '' && (
                        <Button
                            data-id="form-detail-cancel"
                            className={classes.marginLeft}
                            disabled={!isNew && !isFormModified}
                            variant="contained"
                            onClick={handleCancel}
                        >
                            {formatMessage(MESSAGES.cancel)}
                        </Button>
                    )}
                    <Button
                        data-id="form-detail-confirm"
                        disabled={
                            !isFormModified ||
                            !isFormValid(detailRequiredFields, currentForm)
                        }
                        variant="contained"
                        className={classes.marginLeft}
                        color="primary"
                        onClick={() => onConfirm()}
                    >
                        {formatMessage(MESSAGES.save)}
                    </Button>
                </Box>
                {!isNew && (
                    <>
                        <Box>
                            <Tabs
                                value={tab}
                                classes={{
                                    root: classes.tabs,
                                }}
                                onChange={(_, newtab) =>
                                    handleChangeTab(newtab)
                                }
                            >
                                <Tab
                                    value="versions"
                                    label={formatMessage(MESSAGES.versions)}
                                />
                                <Tab
                                    value="attachments"
                                    label={formatMessage(MESSAGES.attachments)}
                                />
                                <Tab
                                    value="filters"
                                    label={formatMessage(
                                        MESSAGES.predefinedFilters,
                                    )}
                                />
                            </Tabs>
                        </Box>
                        {tab === 'versions' && (
                            <FormVersions
                                periodType={
                                    currentForm.period_type.value || undefined
                                }
                                formId={parseInt(params.formId, 10)}
                                params={params}
                            />
                        )}
                        {tab === 'attachments' && (
                            <FormAttachments params={params} />
                        )}
                        {tab === 'filters' && (
                            <FormPredefinedFilters params={params} />
                        )}
                    </>
                )}
            </Box>
        </>
    );
};

export default FormDetail;
