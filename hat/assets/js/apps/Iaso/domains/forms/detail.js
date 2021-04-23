import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Box, makeStyles, Button } from '@material-ui/core';
import mapValues from 'lodash/mapValues';
import omit from 'lodash/omit';
import isEqual from 'lodash/isEqual';

import { fetchAllProjects } from '../projects/actions';
import { fetchAllOrgUnitTypes } from '../orgUnits/types/actions';
import { redirectToReplace } from '../../routing/actions';
import {
    fetchFormDetail,
    setIsLoadingForm,
    setCurrentForm,
    setForms,
} from './actions';

import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { useSafeIntl } from '../../hooks/intl';
import { useFormState } from '../../hooks/form';

import { baseUrls } from '../../constants/urls';

import { createForm, updateForm } from '../../utils/requests';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';
import FormVersions from './components/FormVersionsComponent';
import FormForm from './components/FormFormComponent';

import { enqueueSnackbar } from '../../redux/snackBarsReducer';
import { succesfullSnackBar } from '../../constants/snackBars';

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
    period_type: null,
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
});

const FormDetail = ({ router, params }) => {
    const prevPathname = useSelector(state => state.routerCustom.prevPathname);
    const allOrgUnitTypes = useSelector(state => state.orgUnitsTypes.allTypes);
    const allProjects = useSelector(state => state.projects.allProjects);
    const initialData = useSelector(state => state.forms.current);
    const isLoading = useSelector(state => state.forms.isLoading);
    const [forceRefreshVersions, setForceRefreshVersions] = useState(false);
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
            formData = mapValues(omit(currentForm, ['form_id']), v => v.value);
            saveForm = createForm(dispatch, formData);
        } else {
            isUpdate = true;
            formData = mapValues(currentForm, v => v.value);
            saveForm = updateForm(dispatch, currentForm.id.value, formData);
        }
        dispatch(setIsLoadingForm(true));
        let savedFormData;
        try {
            savedFormData = await saveForm;
            dispatch(setCurrentForm(savedFormData));
            dispatch(enqueueSnackbar(succesfullSnackBar()));
            if (!isUpdate) {
                dispatch(
                    redirectToReplace(baseUrls.formDetail, {
                        formId: savedFormData.id,
                    }),
                );
                setForceRefreshVersions(true);
            }
            dispatch(setForms(null));
        } catch (error) {
            if (error.status === 400) {
                Object.entries(error.details).forEach(
                    ([errorKey, errorMessages]) => {
                        setFieldErrors(errorKey, errorMessages);
                    },
                );
            }
        }
        dispatch(setIsLoadingForm(false));
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
                <FormForm
                    currentForm={currentForm}
                    setFieldValue={setFieldValue}
                />
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
                <FormVersions
                    periodType={currentForm.period_type.value || undefined}
                    forceRefresh={forceRefreshVersions}
                    setForceRefresh={setForceRefreshVersions}
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
