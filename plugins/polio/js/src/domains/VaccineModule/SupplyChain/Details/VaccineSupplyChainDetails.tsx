/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { Box, Button, Grid, Tab, Tabs, makeStyles } from '@material-ui/core';
import { FormikProvider, useFormik } from 'formik';
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
import {
    useGetArrivalReportsDetails,
    useGetPreAlertDetails,
    useGetVrfDetails,
    useSaveVaccineSupplyChainForm,
} from '../hooks/api';
import { useTopBarTitle } from '../hooks/utils';
import { VaccineRequestForm } from './VaccineRequestForm/VaccineRequestForm';
import MESSAGES from '../messages';
import { Vaccine } from '../../../../constants/types';
import { Optional } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { PreAlerts } from './PreAlerts/PreAlerts';
import { VaccineArrivalReports } from './VAR/VaccineArrivalReports';

export const VRF = 'vrf';
export const VAR = 'vars';
export const PREALERT = 'pre_alerts';
export type TabValue = 'vrf' | 'vars' | 'pre_alerts';

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
    vars: Optional<Partial<VAR>[]>;
    activeTab: TabValue;
    saveAll: boolean;
    touchedTabs: TabValue[];
};
type Props = { router: Router };

const useStyles = makeStyles(theme => {
    return {
        ...commonStyles(theme),
        inactiveTab: {
            display: 'none',
        },
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
        vars: undefined,
        activeTab: initialTab,
        saveAll: false,
        touchedTabs: [],
    });
    const dispatch = useDispatch();
    const { data: vrfDetails, isFetching } = useGetVrfDetails(router.params.id);
    const { data: preAlerts, isFetching: isFetchingPreAlerts } =
        useGetPreAlertDetails(router.params.id);
    const { data: arrivalReports, isFetching: isFetchingArrivalReports } =
        useGetArrivalReportsDetails(router.params.id);
    // TODO Check if id and change style accordingly
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
                                variables.touchedTabs.forEach(touchedTab => {
                                    if (touchedTab === VRF) {
                                        newValues[touchedTab] =
                                            variables[touchedTab];
                                    } else {
                                        const newField = variables[
                                            touchedTab
                                        ]?.filter(value => !value.to_delete);
                                        // setFieldValue(touchedTab, newField);
                                        newValues[touchedTab] = newField;
                                    }
                                });
                            } else {
                                const { activeTab } = variables;
                                const fieldVariable = variables[activeTab];
                                if (activeTab === VRF) {
                                    newValues[activeTab] = fieldVariable;
                                } else {
                                    const newFieldValue = (
                                        fieldVariable as
                                            | Partial<PreAlert>[]
                                            | Partial<VAR>[]
                                    )?.filter(value => !value.to_delete);
                                    newValues[activeTab] = newFieldValue;
                                }
                            }
                            formik.setErrors({});
                            formik.setTouched({});
                            setInitialValues(newValues);
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
        isValid && !isSaving && !isSubmitting && !isEqual(formik.touched, {});

    const isTabTouched = Boolean(touched[tab]);
    const isTabValid = !errors[tab];
    // TODO add check that a new values are different from fetched ones.
    const allowSaveTab =
        isTabTouched && isTabValid && !isSaving && !isSubmitting;

    // Using formik's enableReinitialize would cause touched, errors etc to reset when changing tabs
    // So we set values with useEffect once data has been fetched.
    useEffect(() => {
        if (arrivalReports && !values.vars) {
            setFieldValue('vars', arrivalReports.arrival_reports);
        }
    }, [arrivalReports, setFieldValue, values.vars]);
    useEffect(() => {
        if (preAlerts && !values.pre_alerts) {
            setFieldValue('pre_alerts', preAlerts.pre_alerts);
        }
    }, [preAlerts, setFieldValue, values.pre_alerts]);
    useEffect(() => {
        if (vrfDetails && !values.vrf) {
            setFieldValue('vrf', vrfDetails);
        }
    }, [vrfDetails, setFieldValue, values.vrf]);

    const touchedTabs = useMemo(() => Object.keys(touched), [touched]);

    // list touched tabs to avoid patching untouched tabs
    useEffect(() => {
        setFieldValue('touchedTabs', touchedTabs);
    }, [setFieldValue, touchedTabs]);
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
                <VaccineRequestForm
                    className={tab !== VRF ? classes.inactiveTab : undefined}
                    router={router}
                    vrfData={vrfDetails}
                />
                <PreAlerts
                    className={
                        tab !== PREALERT ? classes.inactiveTab : undefined
                    }
                    items={values.pre_alerts}
                />
                <VaccineArrivalReports
                    className={tab !== VAR ? classes.inactiveTab : undefined}
                    items={values.vars}
                />
                <Grid container spacing={2} justifyContent="flex-end">
                    <Box ml={2} mt={4}>
                        <Button
                            variant="contained"
                            className={classes.button}
                            color="primary"
                            onClick={onCancel}
                        >
                            {formatMessage(MESSAGES.cancel)}
                        </Button>
                    </Box>
                    <Box ml={2} mt={4}>
                        <Button
                            variant="contained"
                            className={classes.button}
                            color="primary"
                            onClick={() => handleSubmit()}
                            disabled={!allowSaveTab}
                        >
                            {`${formatMessage(MESSAGES.save)} ${formatMessage(
                                MESSAGES[tab],
                            )}`}
                        </Button>
                    </Box>
                    <Box ml={2} mt={4}>
                        <Button
                            variant="contained"
                            className={classes.button}
                            color="primary"
                            disabled={!allowSaveAll}
                            onClick={() => handleSubmit(true)}
                        >
                            {formatMessage(MESSAGES.saveAll)}
                        </Button>
                    </Box>
                </Grid>
            </Box>
        </FormikProvider>
    );
};
