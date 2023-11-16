/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    LoadingSpinner,
    commonStyles,
    useSafeIntl,
} from 'bluesquare-components';
import { Box, Grid, Tab, Tabs, makeStyles } from '@material-ui/core';
import { FormikErrors, FormikProvider, useFormik } from 'formik';
import classNames from 'classnames';
import { useDispatch } from 'react-redux';
import { isEqual } from 'lodash';
import { redirectToReplace } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import { useTabs } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useTabs';
import {
    VACCINE_SUPPLY_CHAIN,
    VACCINE_SUPPLY_CHAIN_DETAILS,
} from '../../../../constants/routes';
import { Router } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import TopBar from '../../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useGoBack } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/useGoBack';
import { useSaveVaccineSupplyChainForm } from '../hooks/api/useSaveSupplyChainForm';
import { useTopBarTitle } from '../hooks/utils';
import { VaccineRequestForm } from './VaccineRequestForm/VaccineRequestForm';
import MESSAGES from '../messages';
import { Vaccine } from '../../../../constants/types';
import { Optional } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { PreAlerts } from './PreAlerts/PreAlerts';
import { VaccineArrivalReports } from './VAR/VaccineArrivalReports';
import { VaccineSupplyChainConfirmButtons } from './ConfirmButtons';
import { useGetVrfDetails } from '../hooks/api/vrf';
import { useGetPreAlertDetails } from '../hooks/api/preAlerts';
import { useGetArrivalReportsDetails } from '../hooks/api/arrivalReports';

export const VRF = 'vrf';
export const VAR = 'arrival_reports';
export const PREALERT = 'pre_alerts';
export type TabValue = 'vrf' | 'arrival_reports' | 'pre_alerts';

export type VRF = {
    id?: number;
    country: number;
    campaign: string;
    vaccine_type: Vaccine;
    rounds: string; // 1,2
    date_vrf_signature: string; // date in string form
    quantities_ordered_in_doses: number;
    wastage_rate_used_on_vrf: number;
    date_vrf_reception: string; // date in string form
    date_vrf_submission_orpg?: string; // date in string form
    quantities_approved_by_orpg_in_doses?: number;
    date_rrt_orpg_approval?: string; // date in string form
    date_vrf_submission_dg?: string; // date in string form
    quantities_approved_by_dg_in_doses?: number;
    date_dg_approval?: string; // date in string form
    comments?: string;
};

export type PreAlert = {
    id?: number;
    date_reception: string; // date in string form
    po_number: string;
    eta: string;
    lot_number: number;
    expiration_date: string; // date in string form
    doses_shipped: number;
    doses_recieved: number;
    doses_per_vial: number;
    to_delete?: boolean;
};

export type VAR = {
    id?: number;
    report_date: string; // date in string form
    po_number: number;
    lot_number: number;
    expiration_date: string; // date in string form
    doses_shipped: number;
    doses_received: number;
    doses_per_vial: number;
    to_delete?: boolean;
};

export type SupplyChainFormData = {
    vrf: Optional<Partial<VRF>>;
    pre_alerts: Optional<Partial<PreAlert>[]>;
    arrival_reports: Optional<Partial<VAR>[]>;
    activeTab: TabValue;
    saveAll: boolean;
    changedTabs: TabValue[];
};
type Props = { router: Router };

const useStyles = makeStyles(theme => {
    return {
        ...commonStyles(theme),
    };
});

export const VaccineSupplyChainDetails: FunctionComponent<Props> = ({
    router,
}) => {
    const { formatMessage } = useSafeIntl();
    const goBack = useGoBack(router, VACCINE_SUPPLY_CHAIN);
    const classes: Record<string, string> = useStyles();
    const initialTab = (router.params.tab as TabValue) ?? VRF;
    const { tab, handleChangeTab } = useTabs<TabValue>({
        params: router.params,
        defaultTab: initialTab,
        baseUrl: VACCINE_SUPPLY_CHAIN_DETAILS,
    });
    const [initialValues, setInitialValues] = useState<any>({
        vrf: undefined,
        pre_alerts: undefined,
        arrival_reports: undefined,
        activeTab: initialTab,
        saveAll: false,
        changedTabs: [],
    });
    const dispatch = useDispatch();
    const { data: vrfDetails, isFetching } = useGetVrfDetails(router.params.id);
    const { data: preAlerts, isFetching: isFetchingPreAlerts } =
        useGetPreAlertDetails(router.params.id);
    const { data: arrivalReports, isFetching: isFetchingArrivalReports } =
        useGetArrivalReportsDetails(router.params.id);
    const { mutateAsync: saveForm, isLoading: isSaving } =
        useSaveVaccineSupplyChainForm();
    const formik = useFormik<SupplyChainFormData>({
        initialValues,
        enableReinitialize: true,
        onSubmit: () => undefined,
    });
    const { setFieldValue, values, touched, errors, isValid, isSubmitting } =
        formik;
    const handleSubmit = useCallback(
        (saveAll = false) => {
            formik.submitForm();
            saveForm(
                { ...values, saveAll },
                {
                    onSuccess: (data, variables: SupplyChainFormData) => {
                        // if POST request , redirect to replace
                        if (!router.params.id) {
                            dispatch(
                                redirectToReplace(
                                    VACCINE_SUPPLY_CHAIN_DETAILS,
                                    {
                                        id: data.id,
                                    },
                                ),
                            );
                        } else {
                            const newValues = { ...formik.values };
                            if (variables.saveAll) {
                                variables.changedTabs.forEach(touchedTab => {
                                    if (touchedTab === VRF) {
                                        newValues[touchedTab] =
                                            variables[touchedTab];
                                    } else {
                                        const newField = variables[
                                            touchedTab
                                        ]?.filter(value => !value.to_delete);
                                        // @ts-ignore
                                        newValues[touchedTab] = newField;
                                    }
                                });
                                setInitialValues(newValues);
                                formik.setErrors({});
                                formik.setTouched({});
                            } else {
                                const { activeTab } = variables;
                                const fieldVariable = variables[activeTab];
                                if (activeTab === VRF) {
                                    // @ts-ignore
                                    newValues[activeTab] = fieldVariable;
                                } else {
                                    const newFieldValue = (
                                        fieldVariable as
                                            | Partial<PreAlert>[]
                                            | Partial<VAR>[]
                                    )?.filter(value => !value.to_delete);
                                    // @ts-ignore
                                    newValues[activeTab] = newFieldValue;
                                }
                                setInitialValues(newValues);
                                const newErrors: FormikErrors<SupplyChainFormData> =
                                    { ...formik.errors };
                                delete newErrors[activeTab];
                                formik.setErrors(newErrors);
                                const newTouched = {
                                    ...formik.touched,
                                };
                                delete newTouched[activeTab];
                                delete newTouched.saveAll;
                                delete newTouched.activeTab;
                                formik.setTouched(newTouched);
                            }
                        }
                    },
                    onSettled: () => {
                        formik.setSubmitting(false);
                    },
                },
            );
        },
        [dispatch, formik, router.params.id, saveForm, values],
    );
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
    // TODO refine enabled condition
    const title = useTopBarTitle(vrfDetails);
    const allowSaveAll =
        isValid &&
        !isSaving &&
        !isSubmitting &&
        !isEqual(formik.touched, {}) &&
        (!isEqual(initialValues[VRF], values[VRF]) ||
            !isEqual(initialValues[PREALERT], values[PREALERT]) ||
            !isEqual(initialValues[VAR], values[VAR]));

    const isTabTouched = Boolean(touched[tab]);
    const isTabValid = !errors[tab];
    const allowSaveTab =
        isTabTouched &&
        isTabValid &&
        !isSaving &&
        !isSubmitting &&
        !isEqual(initialValues[tab], values[tab]);

    const isLoading =
        isFetchingArrivalReports || isFetchingPreAlerts || isFetching;

    // Using formik's enableReinitialize would cause touched, errors etc to reset when changing tabs
    // So we set values with useEffect once data has been fetched.
    useEffect(() => {
        if (arrivalReports && !values.arrival_reports) {
            setFieldValue('arrival_reports', arrivalReports.arrival_reports);
            // set InitialValues so we can compare with form values and enables/disabel dave button accordingly
            setInitialValues({
                ...initialValues,
                arrival_reports: arrivalReports.arrival_reports,
            });
        }
    }, [arrivalReports, initialValues, setFieldValue, values.arrival_reports]);
    useEffect(() => {
        if (preAlerts && !values.pre_alerts) {
            setFieldValue('pre_alerts', preAlerts.pre_alerts);
            // set InitialValues so we can compare with form values and enables/disabel dave button accordingly
            setInitialValues({
                ...initialValues,
                pre_alerts: preAlerts.pre_alerts,
            });
        }
    }, [initialValues, preAlerts, setFieldValue, values.pre_alerts]);
    useEffect(() => {
        if (vrfDetails && !values.vrf) {
            setFieldValue('vrf', vrfDetails);
            // set initialValues so we can compare with form values and enables/disable save button accordingly
            setInitialValues({
                ...initialValues,
                vrf: vrfDetails,
            });
        }
    }, [vrfDetails, setFieldValue, values.vrf, initialValues]);

    // defining the booleans here to avoid having formik.values as dependency of useEffect, which would cause an infinite loop
    const vrfChanged = !isEqual(initialValues[VRF], values[VRF]);
    const preAlertsChanged = !isEqual(
        initialValues[PREALERT],
        values[PREALERT],
    );
    const arrivalReportsChanged = !isEqual(initialValues[VAR], values[VAR]);

    // list changed tabs to avoid patching unchanged tabs
    useEffect(() => {
        const changedTabs: TabValue[] = [];
        if (vrfChanged) {
            changedTabs.push(VRF);
        }
        if (preAlertsChanged) {
            changedTabs.push(PREALERT);
        }
        if (arrivalReportsChanged) {
            changedTabs.push(VAR);
        }
        setFieldValue('changedTabs', changedTabs);
    }, [preAlertsChanged, setFieldValue, arrivalReportsChanged, vrfChanged]);

    return (
        <FormikProvider value={formik}>
            <TopBar title={title} displayBackButton goBack={goBack}>
                <Tabs
                    value={tab}
                    classes={{
                        root: classes.tabs,
                        indicator: classes.indicator,
                    }}
                    onChange={onChangeTab}
                >
                    <Tab
                        key={VRF}
                        value={VRF}
                        label={formatMessage(MESSAGES[VRF])}
                    />
                    <Tab
                        key={PREALERT}
                        value={PREALERT}
                        label={formatMessage(MESSAGES[PREALERT])}
                        // disable if no saved VRF to avoid users trying to save prealert before vrf
                        disabled={!vrfDetails}
                    />
                    <Tab
                        key={VAR}
                        value={VAR}
                        label={formatMessage(MESSAGES[VAR])}
                        // disable if no saved VRF to avoid users trying to save VAR before vrf
                        disabled={!vrfDetails}
                    />
                </Tabs>
            </TopBar>
            <Box className={classNames(classes.containerFullHeightPadded)}>
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
                                />
                            </Box>
                        </Grid>
                    </>
                )}
            </Box>
        </FormikProvider>
    );
};
