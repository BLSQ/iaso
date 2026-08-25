import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRedirectToReplace } from 'bluesquare-components';
import { useFormik } from 'formik';
import { FormikHelpers } from 'formik';
import { isEqual, merge } from 'lodash';
import { useQueryClient } from 'react-query';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { UuidAsString } from 'Iaso/types/general';
import { Campaign, CampaignFormValues } from '../../../constants/types';
import { baseUrls } from '../../../constants/urls';
import { convertEmptyStringToNull } from '../../../utils/convertEmptyStringToNull';
import { useWarningModal } from '../MainDialog/WarningModal/useWarningModal';
import { useCampaignAPI } from './useCampaignAPI';
import { useValidateCampaign } from './useValidateCampaign';

const baseValues: CampaignFormValues = {
    subactivity: undefined, // we save subactivities one by one, so no array here
    rounds: [],
    scopes: [],
    group: {
        name: 'hidden group',
        org_units: [],
    },
    campaign_types: [],
    integrated_campaigns: [],
    integrated_to: undefined,
    is_preventive: false,
    is_test: false,
    on_hold: false,
    is_planned: false,
    enable_send_weekly_email: true,
    // Those are Polio default values to be set if the types changes to Polio
    has_data_in_budget_tool: false,
    budget_current_state_key: '-',
    detection_status: 'PENDING',
    risk_assessment_status: 'TO_SUBMIT',
    separate_scopes_per_round: false,
    org_unit: undefined,
    non_field_errors: undefined, // TODO find out whether we still use this formik state value or not
};

type CampaignFormStateArgs = { campaignId?: UuidAsString; enableAPI?: boolean };

export const useCampaignFormState = ({
    campaignId,
    enableAPI = true,
}: CampaignFormStateArgs) => {
    const params = useParamsObject(baseUrls.campaignDetails);
    const redirectToReplace = useRedirectToReplace();
    const [selectedCampaignId, setSelectedCampaignId] = useState<
        string | undefined
    >(campaignId);
    useEffect(() => {
        setSelectedCampaignId(campaignId);
    }, [campaignId]);

    const { saveCampaign, isSaving, selectedCampaign, isFetching } =
        useCampaignAPI({
            campaignId: enableAPI ? selectedCampaignId : undefined,
        });

    const [isUpdated, setIsUpdated] = useState<boolean>(false);
    const {
        isWarningOpen: isScopeWarningOpen,
        closeWarning,
        title: scopeWarningTitle,
        body: scopeWarningBody,
        setIsWarningOpen: setIsScopeWarningOpen,
        dataTestId: warningDataTestId,
    } = useWarningModal();
    const queryClient = useQueryClient();
    const validate = useValidateCampaign();
    const initialValues: CampaignFormValues = useMemo(() => {
        if (!campaignId) {
            return baseValues;
        }
        // Merge default values with the campaign data only if we have selected an existing campaign
        return merge({}, baseValues, {
            ...selectedCampaign,
            rounds: selectedCampaign?.rounds
                ? [...selectedCampaign.rounds].sort(
                      (a, b) => a.number - b.number,
                  )
                : [],
        });
    }, [selectedCampaign, campaignId]);

    const formik = useFormik({
        initialValues,
        enableReinitialize: true,
        validateOnBlur: true,
        validate,
        onSubmit: (values, helpers) => {
            handleSubmit(values, helpers);
        },
    });

    const {
        handleSubmit: formikHandleSubmit,
        values,
        initialValues: formikInitialValues,
    } = formik;

    const handleSubmit = useCallback(
        (
            values: CampaignFormValues,
            helpers: FormikHelpers<CampaignFormValues>,
        ) => {
            saveCampaign(convertEmptyStringToNull(values), {
                onSuccess: (result: Campaign) => {
                    setIsUpdated(true);
                    queryClient.setQueryData(
                        ['campaign', selectedCampaignId],
                        values,
                    );
                    if (!selectedCampaignId) {
                        redirectToReplace(baseUrls.campaignDetails, {
                            ...params,
                            campaignId: result.id,
                        });
                    }
                },
                onError: error => {
                    if (error.details) {
                        helpers.setErrors(error.details);
                    }
                },
            });
        },
        [
            saveCampaign,
            queryClient,
            selectedCampaignId,
            redirectToReplace,
            params,
        ],
    );

    const handleClose = useCallback(() => {
        formik.setValues(baseValues);
        setSelectedCampaignId(undefined);
        if (isUpdated) {
            queryClient.invalidateQueries('campaigns');
            queryClient.invalidateQueries('subActivities');
        }
    }, [isUpdated, formik, queryClient]);
    const isFormChanged = !isEqual(values, formikInitialValues);

    const handleConfirm = useCallback(() => {
        // If scope type has changed
        if (
            values.separate_scopes_per_round !==
                formikInitialValues.separate_scopes_per_round &&
            values.id
        ) {
            // Open warning modal
            setIsScopeWarningOpen(true);
        } else {
            formikHandleSubmit();
        }
    }, [
        values.separate_scopes_per_round,
        values.id,
        formikInitialValues.separate_scopes_per_round,
        setIsScopeWarningOpen,
        formikHandleSubmit,
    ]);

    const saveDisabled =
        !isFormChanged ||
        (isFormChanged && !formik.isValid) ||
        isSaving ||
        isFetching;

    return useMemo(() => {
        return {
            isFormChanged,
            formik,
            handleClose,
            isScopeWarningOpen,
            closeWarning,
            scopeWarningTitle,
            scopeWarningBody,
            warningDataTestId,
            setIsScopeWarningOpen,
            handleConfirm,
            saveCampaign,
            isSaving,
            selectedCampaign,
            isFetching,
            saveDisabled,
            showObrInTitle: Boolean(selectedCampaignId),
        };
    }, [
        isFormChanged,
        formik,
        handleClose,
        isScopeWarningOpen,
        closeWarning,
        scopeWarningTitle,
        scopeWarningBody,
        warningDataTestId,
        setIsScopeWarningOpen,
        handleConfirm,
        saveCampaign,
        isSaving,
        selectedCampaign,
        selectedCampaignId,
        isFetching,
        saveDisabled,
    ]);
};
