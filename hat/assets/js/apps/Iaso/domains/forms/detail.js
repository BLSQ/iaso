import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Grid, Box, makeStyles, Button } from '@material-ui/core';
import mapValues from 'lodash/mapValues';
import omit from 'lodash/omit';
import isEqual from 'lodash/isEqual';

import { fetchAllProjects } from '../projects/actions';
import { fetchAllOrgUnitTypes } from '../orgUnits/types/actions';
import { redirectToReplace } from '../../routing/actions';
import { fetchFormDetail, setIsLoadingForm, setCurrentForm } from './actions';

import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { useSafeIntl } from '../../hooks/intl';
import { useFormState } from '../../hooks/form';

import { baseUrls } from '../../constants/urls';

import {
    createForm,
    updateForm,
    createFormVersion,
    deleteForm,
} from '../../utils/requests';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';
import InputComponent from '../../components/forms/InputComponent';
import FileInputComponent from '../../components/forms/FileInputComponent';
import FormVersions from './components/FormVersionsComponent';

import { enqueueSnackbar } from '../../redux/snackBarsReducer';
import { succesfullSnackBar } from '../../constants/snackBars';

import { periodTypeOptions } from '../periods/constants';
import { commaSeparatedIdsToArray } from '../../utils/forms';
import commonStyles from '../../styles/common';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const defaultForm = {
    id: '',
    name: '',
    short_name: '',
    depth: null,
    org_unit_type_ids: [],
    project_ids: [],
    xls_file: null,
    period_type: '',
    derived: false,
    single_per_period: false,
    periods_before_allowed: 0,
    periods_after_allowed: 0,
    device_field: 'deviceid',
    location_field: '',
};

const initialFormState = (form = defaultForm) => ({
    id: form.id,
    name: form.name,
    short_name: form.short_name,
    depth: form.depth,
    org_unit_type_ids: form.org_unit_types
        ? form.org_unit_types.map(ot => ot.id)
        : [],
    project_ids: form.projects ? form.projects.map(p => p.id) : [],
    xls_file: null,
    period_type: form.period_type,
    derived: form.derived,
    single_per_period: form.single_per_period,
    periods_before_allowed: form.periods_before_allowed,
    periods_after_allowed: form.periods_after_allowed,
    device_field: form.device_field,
    location_field: form.location_field,
});

const FormDetail = ({ router, params }) => {
    const prevPathname = useSelector(state => state.routerCustom.prevPathname);
    const allOrgUnitTypes = useSelector(state => state.orgUnitsTypes.allTypes);
    const allProjects = useSelector(state => state.projects.allProjects);
    const initialData = useSelector(state => state.forms.current);
    const isLoading = useSelector(state => state.forms.isLoading);

    const dispatch = useDispatch();
    const intl = useSafeIntl();
    const classes = useStyles();
    const [
        currentForm,
        setFieldValue,
        setFieldErrors,
        setFormState,
    ] = useFormState(initialFormState(initialData));

    const onConfirm = async () => {
        let isUpdate;
        let saveForm;
        let formData;
        if (params.formId === '0') {
            isUpdate = false;
            formData = mapValues(
                omit(currentForm, ['xls_file', 'form_id']),
                v => v.value,
            );
            saveForm = createForm(dispatch, formData);
        } else {
            isUpdate = true;
            formData = mapValues(omit(currentForm, 'xls_file'), v => v.value);
            saveForm = updateForm(dispatch, currentForm.id.value, formData);
        }
        dispatch(setIsLoadingForm(true));
        let isSaveSuccessful = false;
        let savedFormData;
        try {
            savedFormData = await saveForm;
            dispatch(setCurrentForm(savedFormData));
            if (
                !isUpdate ||
                (isUpdate && currentForm.xls_file.value !== null)
            ) {
                try {
                    await createFormVersion(
                        dispatch,
                        {
                            form_id: savedFormData.id,
                            xls_file: currentForm.xls_file.value,
                        },
                        isUpdate,
                    );
                    isSaveSuccessful = true;
                } catch (createVersionError) {
                    // when creating form, if version creation fails, delete freshly created, version-less form
                    if (!isUpdate) {
                        try {
                            await deleteForm(dispatch, savedFormData.id);
                            console.log('Form deleted');
                        } catch (deleteFormError) {
                            console.warn('Form could not be deleted');
                        }
                    }
                }
            } else {
                isSaveSuccessful = true;
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
        if (isSaveSuccessful) {
            dispatch(enqueueSnackbar(succesfullSnackBar()));
            if (!isUpdate) {
                dispatch(
                    redirectToReplace(baseUrls.formDetail, {
                        formId: savedFormData.id,
                    }),
                );
            }
        }
        dispatch(setIsLoadingForm(false));
    };

    const setPeriodType = value => {
        setFieldValue('period_type', value);
        if (value === null) {
            setFieldValue('single_per_period', false);
            setFieldValue('periods_before_allowed', 0);
            setFieldValue('periods_after_allowed', 0);
        } else {
            setFieldValue('periods_before_allowed', 3);
            setFieldValue('periods_after_allowed', 3);
        }
    };

    const handleReset = () => {
        setFormState(initialFormState(initialData));
    };

    useEffect(() => {
        if (!allProjects) {
            dispatch(fetchAllProjects());
        }
        if (!allOrgUnitTypes) {
            dispatch(fetchAllOrgUnitTypes());
        }
        if (params.formId && params.formId !== '0') {
            dispatch(fetchFormDetail(params.formId));
        } else {
            dispatch(setCurrentForm(undefined));
            dispatch(setIsLoadingForm(false));
        }
    }, []);

    useEffect(() => {
        setFormState(initialFormState(initialData));
    }, [initialData]);

    const isFormModified = !isEqual(
        mapValues(currentForm, v => v.value),
        initialFormState(initialData),
    );
    let orgUnitTypes;
    if (currentForm.org_unit_type_ids.value.length > 0) {
        orgUnitTypes = currentForm.org_unit_type_ids.value.join(',');
    }
    let projects;
    if (currentForm.project_ids.value.length > 0) {
        projects = currentForm.project_ids.value.join(',');
    }
    return (
        <>
            <TopBar
                title={`${intl.formatMessage(MESSAGES.detailTitle)}: ${
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

            {isLoading && <LoadingSpinner />}
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container spacing={2} justify="flex-start">
                    <Grid xs={6} item>
                        <InputComponent
                            keyValue="name"
                            onChange={(key, value) => setFieldValue(key, value)}
                            value={currentForm.name.value}
                            errors={currentForm.name.errors}
                            type="text"
                            label={MESSAGES.name}
                            required
                        />
                        <Grid container direction="column">
                            <Grid item>
                                <FileInputComponent
                                    keyValue="xls_file"
                                    onChange={(key, value) =>
                                        setFieldValue(key, value)
                                    }
                                    value={currentForm.xls_file.value}
                                    label={MESSAGES.xls_form_file}
                                    errors={currentForm.xls_file.errors}
                                    required
                                />
                            </Grid>
                        </Grid>
                        <InputComponent
                            keyValue="period_type"
                            clearable
                            onChange={(key, value) => setPeriodType(value)}
                            value={currentForm.period_type.value}
                            errors={currentForm.period_type.errors}
                            type="select"
                            options={periodTypeOptions}
                            label={MESSAGES.periodType}
                        />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <InputComponent
                                    keyValue="periods_before_allowed"
                                    disabled={
                                        currentForm.period_type.value === null
                                    }
                                    onChange={(key, value) =>
                                        setFieldValue(key, value)
                                    }
                                    value={
                                        currentForm.periods_before_allowed.value
                                    }
                                    errors={
                                        currentForm.periods_before_allowed
                                            .errors
                                    }
                                    type="number"
                                    label={MESSAGES.periodsBeforeAllowed}
                                    required
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <InputComponent
                                    keyValue="periods_after_allowed"
                                    disabled={
                                        currentForm.period_type.value === null
                                    }
                                    onChange={(key, value) =>
                                        setFieldValue(key, value)
                                    }
                                    value={
                                        currentForm.periods_after_allowed.value
                                    }
                                    errors={
                                        currentForm.periods_after_allowed.errors
                                    }
                                    type="number"
                                    label={MESSAGES.periodsAfterAllowed}
                                    required
                                />
                            </Grid>
                        </Grid>

                        <InputComponent
                            keyValue="single_per_period"
                            disabled={currentForm.period_type.value === null}
                            onChange={(key, value) => setFieldValue(key, value)}
                            value={currentForm.single_per_period.value}
                            errors={currentForm.single_per_period.errors}
                            type="checkbox"
                            label={MESSAGES.singlePerPeriod}
                        />
                    </Grid>
                    <Grid xs={6} item>
                        <InputComponent
                            multi
                            clearable
                            keyValue="project_ids"
                            onChange={(key, value) =>
                                setFieldValue(
                                    key,
                                    commaSeparatedIdsToArray(value),
                                )
                            }
                            value={projects}
                            errors={currentForm.project_ids.errors}
                            type="select"
                            options={
                                allProjects
                                    ? allProjects.map(p => ({
                                          label: p.name,
                                          value: p.id,
                                      }))
                                    : []
                            }
                            label={MESSAGES.projects}
                            required
                        />
                        <InputComponent
                            multi
                            clearable
                            keyValue="org_unit_type_ids"
                            onChange={(key, value) =>
                                setFieldValue(
                                    key,
                                    commaSeparatedIdsToArray(value),
                                )
                            }
                            value={orgUnitTypes}
                            errors={currentForm.org_unit_type_ids.errors}
                            type="select"
                            options={
                                allOrgUnitTypes
                                    ? allOrgUnitTypes.map(o => ({
                                          label: o.name,
                                          value: o.id,
                                      }))
                                    : []
                            }
                            label={MESSAGES.orgUnitsTypes}
                        />
                        <InputComponent
                            keyValue="device_field"
                            onChange={(key, value) => setFieldValue(key, value)}
                            value={currentForm.device_field.value}
                            errors={currentForm.device_field.errors}
                            type="text"
                            label={MESSAGES.deviceField}
                        />
                        <InputComponent
                            keyValue="location_field"
                            onChange={(key, value) => setFieldValue(key, value)}
                            value={currentForm.location_field.value}
                            errors={currentForm.location_field.errors}
                            type="text"
                            label={MESSAGES.locationField}
                        />
                        <InputComponent
                            keyValue="derived"
                            onChange={(key, value) => setFieldValue(key, value)}
                            value={currentForm.derived.value}
                            errors={currentForm.derived.errors}
                            type="checkbox"
                            required
                            label={MESSAGES.derived}
                        />
                    </Grid>
                </Grid>
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
                        disabled={!isFormModified}
                        variant="contained"
                        className={classes.marginLeft}
                        color="primary"
                        onClick={() => onConfirm()}
                    >
                        <FormattedMessage {...MESSAGES.save} />
                    </Button>
                </Box>
                <FormVersions formId={params.formId} />
            </Box>
        </>
    );
};

FormDetail.propTypes = {
    router: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
};

export default FormDetail;
