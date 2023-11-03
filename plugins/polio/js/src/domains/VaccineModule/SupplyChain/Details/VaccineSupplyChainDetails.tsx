/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { Box, Button, Grid, Tab, Tabs, makeStyles } from '@material-ui/core';
import { FormikProvider, useFormik } from 'formik';
import classNames from 'classnames';
import { useTabs } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useTabs';
import { VACCINE_SUPPLY_CHAIN_DETAILS } from '../../../../constants/routes';
import { Router } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import TopBar from '../../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useGoBack } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/useGoBack';
import { useGetVrfDetails } from '../hooks/api';
import { useTopBarTitle } from '../hooks/utils';
import { VaccineRequestForm } from './VaccineRequestForm/VaccineRequestForm';
import MESSAGES from '../messages';
import { Vaccine } from '../../../../constants/types';
import { Optional } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';

const VRF = 'VRF';
const VAR = 'VAR';
const PREALERT = 'PREALERT';
type Props = { router: Router };
type TabValue = 'VRF' | 'VAR' | 'PREALERT';

export type VRF = {
    country: number;
    campaign: string;
    vaccine_type: Vaccine;
    rounds: string; // 1,2
    date_vrf_signature: string; // date in string form
    quantity_ordered: number;
    wastage_ratio: number;
    date_vrf_reception: string; // date in string form
    date_vrf_submission_orpg?: string; // date in string form
    quantity_approved_orpg?: number;
    date_orpg_approval?: string; // date in string form
    date_vrf_submission_dg?: string; // date in string form
    quantity_approved_dg?: number;
    date_dg_approval?: string; // date in string form
    comments?: string;
};

export type PreAlert = {
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
    report_date: string; // date in string form
    po_number: number;
    lot_number: number;
    expiration_date: string; // date in string form
    doses_shipped: number;
    doses_recieved: number;
    doses_per_vial: number;
};

type FormData = {
    vrf: Optional<VRF>;
    prealert: Optional<Partial<PreAlert>[]>;
    var: Optional<Partial<VAR>[]>;
};

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
    const goBack = useGoBack(router, VACCINE_SUPPLY_CHAIN_DETAILS);
    const classes: Record<string, string> = useStyles();
    const { tab, handleChangeTab } = useTabs<TabValue>({
        params: router.params,
        defaultTab: (router.params.tab as TabValue) ?? VRF,
        baseUrl: VACCINE_SUPPLY_CHAIN_DETAILS,
    });
    // TODO Check if id and change style accordingly

    const formik = useFormik<FormData>({
        initialValues: {},
        onSubmit: async () => null,
        enableReinitialize: true,
    });

    // TODO refine enabled condition
    const { data: vrfDetails, isFetching } = useGetVrfDetails(router.params.id);
    const title = useTopBarTitle(vrfDetails);
    console.log('DATA', vrfDetails);
    return (
        <FormikProvider value={formik}>
            <TopBar title={title} displayBackButton goBack={goBack}>
                <Tabs
                    value={tab}
                    classes={{
                        root: classes.tabs,
                        indicator: classes.indicator,
                    }}
                    onChange={handleChangeTab}
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
