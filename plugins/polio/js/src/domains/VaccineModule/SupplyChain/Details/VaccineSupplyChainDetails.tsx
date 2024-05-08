/* eslint-disable camelcase */
import React, { FunctionComponent, useCallback } from 'react';
import { LoadingSpinner, commonStyles } from 'bluesquare-components';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { FormikProvider, useFormik } from 'formik';
import classnames from 'classnames';
import { useParamsObject } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { useTabs } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useTabs';
import TopBar from '../../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useGoBack } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useGoBack';
import { useSaveVaccineSupplyChainForm } from '../hooks/api/useSaveSupplyChainForm';
import { VaccineRequestForm } from './VaccineRequestForm/VaccineRequestForm';
import { PreAlerts } from './PreAlerts/PreAlerts';
import { VaccineArrivalReports } from './VAR/VaccineArrivalReports';
import { VaccineSupplyChainConfirmButtons } from './ConfirmButtons';
import { useGetVrfDetails } from '../hooks/api/vrf';
import { useGetPreAlertDetails } from '../hooks/api/preAlerts';
import { useGetArrivalReportsDetails } from '../hooks/api/arrivalReports';
import {
    PreAlert,
    SupplyChainFormData,
    TabValue,
    VAR as VARType,
    VRF as VrfType,
} from '../types';
import { PREALERT, VAR, VRF } from '../constants';
import { useTopBarTitle } from '../hooks/useTopBarTitle';
import { useSupplyChainFormValidator } from '../hooks/validation';
import { useObjectState } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useObjectState';
import {
    useEnableSaveButtons,
    useHandleSubmit,
    useInitializeArrivalReportsOnFetch,
    useInitializePreAlertsOnFetch,
    useInitializeVRFOnFetch,
    useWatchChangedTabs,
} from '../hooks/utils';
import { SupplyChainTabs } from './SupplyChainTabs';
import { Optional } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { baseUrls } from '../../../../constants/urls';
import { useRedirectToReplace } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/routing';

const useStyles = makeStyles(theme => {
    return {
        ...commonStyles(theme),
    };
});

type VaccineSupplyChainDetailsParams = {
    id?: string;
    tab?: string;
};

export const VaccineSupplyChainDetails: FunctionComponent = () => {
    const params = useParamsObject(
        baseUrls.vaccineSupplyChainDetails,
    ) as VaccineSupplyChainDetailsParams;
    const goBack = useGoBack(baseUrls.vaccineSupplyChain);
    const classes: Record<string, string> = useStyles();
    const initialTab = (params.tab as TabValue) ?? VRF;
    const { tab, handleChangeTab } = useTabs<TabValue>({
        params,
        defaultTab: initialTab,
        baseUrl: baseUrls.vaccineSupplyChainDetails,
    });
    const [initialValues, setInitialValues] = useObjectState({
        vrf: undefined,
        pre_alerts: undefined,
        arrival_reports: undefined,
        activeTab: initialTab,
        saveAll: false,
        changedTabs: [],
    });
    const { data: vrfDetails, isFetching } = useGetVrfDetails(params.id);

    const { data: preAlerts, isFetching: isFetchingPreAlerts } =
        useGetPreAlertDetails(params.id);

    const { data: arrivalReports, isFetching: isFetchingArrivalReports } =
        useGetArrivalReportsDetails(params.id);

    const { mutateAsync: saveForm, isLoading: isSaving } =
        useSaveVaccineSupplyChainForm();

    const title = useTopBarTitle(vrfDetails as VrfType);

    const validationSchema = useSupplyChainFormValidator();

    const formik = useFormik<SupplyChainFormData>({
        initialValues,
        // required to enable data refresh after save
        enableReinitialize: true,
        // bypassing formik's onSubmit so we can re-use a custom fucntion for save and save all
        onSubmit: () => undefined,
        validationSchema,
    });
    const { setFieldValue, values } = formik;

    const isLoading =
        isFetchingArrivalReports || isFetchingPreAlerts || isFetching;

    const { allowSaveAll, allowSaveTab } = useEnableSaveButtons({
        formik,
        isSaving,
        initialValues,
        tab,
    });
    const redirect = useRedirectToReplace();

    const onChangeTab = useCallback(
        (_event, newTab) => {
            handleChangeTab(_event, newTab);
            formik.setFieldValue('activeTab', newTab);
        },
        [formik, handleChangeTab],
    );
    const onCancel = useCallback(() => {
        formik.resetForm();
    }, [formik]);

    // eslint-disable-next-line no-unused-vars
    const handleSubmit: (saveAll?: boolean | undefined) => void =
        useHandleSubmit({
            formik,
            params,
            initialValues,
            setInitialValues,
            saveForm,
            redirect,
        });

    // Using formik's enableReinitialize would cause touched, errors etc to reset when changing tabs
    // So we set values with useEffect once data has been fetched in these custom hooks

    useInitializeVRFOnFetch({
        vrf: vrfDetails as Optional<VrfType>,
        setFieldValue,
        setInitialValues,
    });

    useInitializePreAlertsOnFetch({
        preAlerts: preAlerts as Optional<PreAlert[]>,
        setFieldValue,
        setInitialValues,
    });

    useInitializeArrivalReportsOnFetch({
        arrivalReports: arrivalReports as Optional<VARType[]>,
        setFieldValue,
        setInitialValues,
    });

    // list changed tabs to avoid patching unchanged tabs
    useWatchChangedTabs({ initialValues, values, setFieldValue });
    return (
        <FormikProvider value={formik}>
            <TopBar title={title} displayBackButton goBack={goBack}>
                <SupplyChainTabs
                    tab={tab}
                    onChangeTab={onChangeTab}
                    disabled={!vrfDetails}
                />
            </TopBar>
            <Box className={classnames(classes.containerFullHeightPadded)}>
                {isLoading && <LoadingSpinner />}
                {!isLoading && (
                    <>
                        {tab === VRF && (
                            <VaccineRequestForm vrfData={vrfDetails} />
                        )}
                        {tab === PREALERT && (
                            <PreAlerts items={values.pre_alerts} />
                        )}
                        {tab === VAR && (
                            <VaccineArrivalReports
                                items={values.arrival_reports}
                            />
                        )}
                        <Grid container spacing={2} justifyContent="flex-end">
                            <Box style={{ display: 'inline-flex' }} mr={3}>
                                <VaccineSupplyChainConfirmButtons
                                    className={classes.button}
                                    tab={tab}
                                    onSubmitTab={() => handleSubmit()}
                                    onSubmitAll={() => handleSubmit(true)}
                                    onCancel={onCancel}
                                    allowSaveTab={allowSaveTab}
                                    allowSaveAll={allowSaveAll}
                                    showSaveAllButton={Boolean(values?.vrf?.id)}
                                />
                            </Box>
                        </Grid>
                    </>
                )}
            </Box>
        </FormikProvider>
    );
};
