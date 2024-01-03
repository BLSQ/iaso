import React, {
    useCallback,
    useEffect,
    useState,
    useMemo,
    FunctionComponent,
} from 'react';
import { useQueryClient } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, Tabs, Tab } from '@mui/material';
import { makeStyles } from '@mui/styles';
import mapValues from 'lodash/mapValues';
import omit from 'lodash/omit';
import isEqual from 'lodash/isEqual';

import {
    commonStyles,
    LoadingSpinner,
    useSafeIntl,
    CommonStyles,
} from 'bluesquare-components';
import { redirectToReplace } from '../../routing/actions';

import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages.js';
import { useFormState } from '../../hooks/form.js';

import { baseUrls } from '../../constants/urls.js';

import { createForm, updateForm } from '../../utils/requests';
import FormVersions from './components/FormVersionsComponent';
import FormForm from './components/FormFormComponent';

import { enqueueSnackbar } from '../../redux/snackBarsReducer';
import { succesfullSnackBar } from '../../constants/snackBars';
import { useGetForm } from './requests';
import { requiredFields } from './config/index';

import { isFieldValid, isFormValid } from '../../utils/forms';
import { FormAttachments } from './components/FormAttachments';
import { FormParams } from './types/forms';
import { Router } from '../../types/general';

interface FormDetailProps {
    router: Router;
    params: FormParams;
}

const useStyles = makeStyles(theme => ({
    ...(commonStyles(theme) as unknown as CommonStyles),
    tabs: {
        ...commonStyles(theme).tabs,
        padding: 0,
    },
}));

const defaultForm = {
    id: null,
    name: '',
    short_name: '',
    depth: null,
    org_unit_type_ids: [],
    project_ids: [],
    period_type: null,
    derived: false,
    single_per_period: null,
    periods_before_allowed: 0,
    periods_after_allowed: 0,
    device_field: 'deviceid',
    location_field: '',
    possible_fields: [],
    label_keys: [],
    legend_threshold: null,
};

const formatFormData = value => {
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
    };
};

const FormDetail: FunctionComponent<FormDetailProps> = ({ router, params }) => {
    const queryClient = useQueryClient();
    const prevPathname = useSelector(
        (state: any) => state.routerCustom.prevPathname,
    );
    const { data: form, isLoading: isFormLoading } = useGetForm(params.formId);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [tab, setTab] = useState(params.tab || 'versions');
    const [forceRefreshVersions, setForceRefreshVersions] = useState(false);
    const dispatch = useDispatch();
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

    const onConfirm = async () => {
        let isUpdate;
        let saveForm;
        let formData;
        if (params.formId === '0') {
            isUpdate = false;
            formData = mapValues(
                omit(currentForm, ['form_id', 'possible_fields']),
                v => v.value,
            );
            saveForm = createForm(dispatch, formData);
        } else {
            isUpdate = true;
            formData = mapValues(
                omit(currentForm, ['possible_fields']),
                v => v.value,
            );
            saveForm = updateForm(dispatch, currentForm.id.value, formData);
        }
        setIsLoading(true);
        let savedFormData;
        try {
            savedFormData = await saveForm;
            dispatch(enqueueSnackbar(succesfullSnackBar()));
            if (!isUpdate) {
                dispatch(
                    redirectToReplace(baseUrls.formDetail, {
                        formId: savedFormData.id,
                    }),
                );
                setForceRefreshVersions(true);
            } else {
                queryClient.resetQueries([
                    'formDetailsForInstance',
                    `${savedFormData.id}`,
                ]);
                queryClient.resetQueries(['forms']);
            }
        } catch (error) {
            if (error.status === 400) {
                Object.entries(error.details).forEach(
                    ([errorKey, errorMessages]) => {
                        setFieldErrors(errorKey, errorMessages);
                    },
                );
            }
        }
        setIsLoading(false);
        setIsSaved(true);
    };

    const handleReset = useCallback(() => {
        setFormState(formatFormData(form));
    }, [form, setFormState]);

    const onChange = useCallback(
        (keyValue, value) => {
            if (isSaved) setIsSaved(false);
            setFieldValue(keyValue, value);
            if (!isFieldValid(keyValue, value, requiredFields)) {
                setFieldErrors(keyValue, [
                    formatMessage(MESSAGES.requiredField),
                ]);
            }
        },
        [isSaved, setFieldValue, setFieldErrors, formatMessage],
    );
    const handleChangeTab = (newTab: string) => {
        setTab(newTab);
        const newParams = {
            ...params,
            tab: newTab,
        };
        dispatch(redirectToReplace(baseUrls.formDetail, newParams));
    };
    useEffect(() => {
        if (form) {
            setFormState(formatFormData(form));
        }
    }, [form, setFormState]);
    return (
        <>
            <TopBar
                title={`${formatMessage(MESSAGES.detailTitle)}: ${
                    currentForm.name.value
                }`}
                displayBackButton
                goBack={() => {
                    if (prevPathname) {
                        router.goBack();
                    } else {
                        dispatch(redirectToReplace(baseUrls.forms, {}));
                    }
                }}
            />
            {(isLoading || isFormLoading) && <LoadingSpinner />}
            <Box className={classes.containerFullHeightNoTabPadded}>
                <FormForm currentForm={currentForm} setFieldValue={onChange} />
                <Box mt={2} justifyContent="flex-end" display="flex">
                    {currentForm.id.value !== '' && (
                        <Button
                            data-id="form-detail-cancel"
                            className={classes.marginLeft}
                            disabled={!isFormModified}
                            variant="contained"
                            onClick={() => handleReset()}
                        >
                            {formatMessage(MESSAGES.cancel)}
                        </Button>
                    )}
                    <Button
                        data-id="form-detail-confirm"
                        disabled={
                            !isFormModified ||
                            !isFormValid(requiredFields, currentForm)
                        }
                        variant="contained"
                        className={classes.marginLeft}
                        color="primary"
                        onClick={() => onConfirm()}
                    >
                        {formatMessage(MESSAGES.save)}
                    </Button>
                </Box>
                <Box>
                    <Tabs
                        value={tab}
                        classes={{
                            root: classes.tabs,
                        }}
                        onChange={(_, newtab) => handleChangeTab(newtab)}
                    >
                        <Tab
                            value="versions"
                            label={formatMessage(MESSAGES.versions)}
                        />
                        <Tab
                            value="attachments"
                            label={formatMessage(MESSAGES.attachments)}
                        />
                    </Tabs>
                </Box>
                {tab === 'versions' && (
                    <FormVersions
                        periodType={currentForm.period_type.value || undefined}
                        forceRefresh={forceRefreshVersions}
                        setForceRefresh={setForceRefreshVersions}
                        formId={parseInt(params.formId, 10)}
                    />
                )}
                {tab === 'attachments' && <FormAttachments params={params} />}
            </Box>
        </>
    );
};

export default FormDetail;
