import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { Box, makeStyles, Button } from '@material-ui/core';
import mapValues from 'lodash/mapValues';
import omit from 'lodash/omit';
import isEqual from 'lodash/isEqual';

import {
    useSafeIntl,
    commonStyles,
    LoadingSpinner,
} from 'bluesquare-components';
import { fetchAllProjects } from '../projects/actions';
import { fetchAllOrgUnitTypes } from '../orgUnits/types/actions';
import { redirectToReplace } from '../../routing/actions';
import { setForms } from './actions';

import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from './messages';
import { useFormState } from '../../hooks/form';

import { baseUrls } from '../../constants/urls';

import { createForm, updateForm, useAPI } from '../../utils/requests';
import FormVersions from './components/FormVersionsComponent';
import FormForm from './components/FormFormComponent';

import { enqueueSnackbar } from '../../redux/snackBarsReducer';
import { succesfullSnackBar } from '../../constants/snackBars';
import { fetchFormDetails } from './requests';

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
    const prevPathname = useSelector(state => state.routerCustom.prevPathname);
    const allOrgUnitTypes = useSelector(state => state.orgUnitsTypes.allTypes);
    const allProjects = useSelector(state => state.projects.allProjects);
    const { data: form, isLoading: isFormLoading } = useAPI(
        fetchFormDetails,
        params.formId,
        {
            preventTrigger: !(params.formId && params.formId !== '0'),
            additionalDependencies: [],
        },
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [forceRefreshVersions, setForceRefreshVersions] = useState(false);
    const dispatch = useDispatch();
    const intl = useSafeIntl();
    const classes = useStyles();
    const [currentForm, setFieldValue, setFieldErrors, setFormState] =
        useFormState(formatFormData(form));

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
        setIsLoading(false);
        setIsSaved(true);
    };

    const handleReset = useCallback(() => {
        setFormState(formatFormData(form));
    }, [form, setFormState]);

    const onChange = useCallback(
        (keyValue, value) => {
            setFieldValue(keyValue, value);
            if (isSaved) setIsSaved(false);
        },
        [isSaved, setFieldValue],
    );

    useEffect(() => {
        if (!allProjects) {
            dispatch(fetchAllProjects());
        }
        if (!allOrgUnitTypes) {
            dispatch(fetchAllOrgUnitTypes());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setFormState(formatFormData(form));
    }, [form, setFormState]);

    const isFormModified =
        !isEqual(
            mapValues(currentForm, v => v.value),
            formatFormData(form),
        ) && !isSaved;
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
