import React, { useCallback, useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useQueryClient } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Box, Button, makeStyles } from '@material-ui/core';
import mapValues from 'lodash/mapValues';
import omit from 'lodash/omit';
import isEqual from 'lodash/isEqual';

import {
    commonStyles,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import { redirectToReplace } from '../../routing/actions';

import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { useFormState } from '../../hooks/form';

import { baseUrls } from '../../constants/urls';

import { createForm, updateForm } from '../../utils/requests';
import FormVersions from './components/FormVersionsComponent';
import FormForm from './components/FormFormComponent';

import { enqueueSnackbar } from '../../redux/snackBarsReducer';
import { succesfullSnackBar } from '../../constants/snackBars';
import { useGetForm } from './requests';
import { requiredFields } from './config';

import { isFieldValid, isFormValid } from '../../utils/forms';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
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
            ? form.org_unit_types.map(ot => ot.id)
            : [],
        project_ids: form.projects ? form.projects.map(p => p.id) : [],
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
    };
};

const FormDetail = ({ router, params }) => {
    const queryClient = useQueryClient();
    const prevPathname = useSelector(state => state.routerCustom.prevPathname);
    const { data: form, isLoading: isFormLoading } = useGetForm(params.formId);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [forceRefreshVersions, setForceRefreshVersions] = useState(false);
    const dispatch = useDispatch();
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
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


    useEffect(() => {
        setFormState(formatFormData(form));
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
                    {!currentForm.id.value !== '' && (
                        <Button
                            data-id="form-detail-cancel"
                            className={classes.marginLeft}
                            disabled={!isFormModified}
                            variant="contained"
                            onClick={() => handleReset()}
                        >
                            <FormattedMessage {...MESSAGES.cancel} />
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
                        <FormattedMessage {...MESSAGES.save} />
                    </Button>
                </Box>
                <FormVersions
                    periodType={currentForm.period_type.value || undefined}
                    forceRefresh={forceRefreshVersions}
                    setForceRefresh={setForceRefreshVersions}
                    formId={parseInt(params.formId, 10)}
                />
            </Box>
        </>
    );
};

FormDetail.propTypes = {
    router: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
};

export default FormDetail;
