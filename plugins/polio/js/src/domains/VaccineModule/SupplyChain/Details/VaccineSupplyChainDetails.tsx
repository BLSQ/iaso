/* eslint-disable camelcase */
import React, { FunctionComponent, useCallback } from 'react';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { Box, Button, Grid, Tab, Tabs, makeStyles } from '@material-ui/core';
import { FormikProvider, useFormik } from 'formik';
import classNames from 'classnames';
import { useDispatch } from 'react-redux';
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

export const VRF = 'VRF';
export const VAR = 'VAR';
export const PREALERT = 'PREALERT';
export type TabValue = 'VRF' | 'VAR' | 'PREALERT';

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
};

export type VAR = {
    id?: number;
    report_date: string; // date in string form
    po_number: number;
    lot_number: number;
    expiration_date: string; // date in string form
    doses_shipped: number;
    doses_recieved: number;
    doses_per_vial: number;
};

type FormData = {
    vrf: Partial<VRF>;
    pre_alerts: Optional<Partial<PreAlert>[]>;
    var: Optional<Partial<VAR>[]>;
    activeTab: TabValue;
    saveAll: boolean;
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
    const dispatch = useDispatch();
    const { data: vrfDetails, isFetching } = useGetVrfDetails(router.params.id);
    const { data: preAlerts, isFetching: isFetchingPreAlerts } =
        useGetPreAlertDetails(router.params.id);
    const { data: arrivalReports, isFetching: isFetchingArrivalReports } =
        useGetArrivalReportsDetails(router.params.id);
    console.log('preAlerts', preAlerts);
    // TODO Check if id and change style accordingly
    const { mutateAsync: saveForm } = useSaveVaccineSupplyChainForm();
    const formik = useFormik<FormData>({
        initialValues: {
            vrf: vrfDetails ?? {},
            pre_alerts: preAlerts ?? [],
            var: arrivalReports ?? [],
            activeTab: initialTab,
            saveAll: false,
        },
        onSubmit: (values, helpers) =>
            saveForm(values, {
                onSuccess: (data, variables, context) => {
                    console.log('DATA', data);
                    console.log('VARIABLES', variables);
                    console.log('CONTEXT', context);
                    // if POST request , redirect to replace
                    if (!router.params.id) {
                        dispatch(
                            redirectToReplace(VACCINE_SUPPLY_CHAIN_DETAILS, {
                                id: data.id,
                            }),
                        );
                    }
                },
            }),
        enableReinitialize: true,
    });

    const onChangeTab = useCallback(
        (_event, newTab) => {
            handleChangeTab(_event, newTab);
            formik.setFieldValue('activeTab', newTab);
        },
        [formik, handleChangeTab],
    );

    // TODO refine enabled condition
    const title = useTopBarTitle(vrfDetails);

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
                        label={formatMessage(MESSAGES.VRF)}
                    />
                    <Tab
                        key={PREALERT}
                        value={PREALERT}
                        label={formatMessage(MESSAGES.PREALERT)}
                        // disable if no saved VRF to avoid users trying to save prealert before vrf
                        disabled={!vrfDetails}
                    />
                    <Tab
                        key={VAR}
                        value={VAR}
                        label={formatMessage(MESSAGES.VAR)}
                        // disable if no saved VRF to avoid users trying to save VAR before vrf
                        disabled={!vrfDetails}
                    />
                </Tabs>
            </TopBar>
            <Box className={classNames(classes.containerFullHeightPadded)}>
                <VaccineRequestForm
                    className={tab !== VRF ? classes.inactiveTab : undefined}
                    router={router}
                />
                <PreAlerts
                    className={
                        tab !== PREALERT ? classes.inactiveTab : undefined
                    }
                    router={router}
                />
                <VaccineArrivalReports
                    className={tab !== VAR ? classes.inactiveTab : undefined}
                    router={router}
                />
                <Grid container spacing={2} justifyContent="flex-end">
                    <Box ml={2} mt={4}>
                        <Button
                            variant="contained"
                            className={classes.button}
                            color="primary"
                        >
                            {formatMessage(MESSAGES.cancel)}
                        </Button>
                    </Box>
                    <Box ml={2} mt={4}>
                        <Button
                            variant="contained"
                            className={classes.button}
                            color="primary"
                            onClick={() => formik.handleSubmit()}
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
                        >
                            {formatMessage(MESSAGES.saveAll)}
                        </Button>
                    </Box>
                </Grid>
            </Box>
        </FormikProvider>
    );
};
