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

const VRF = 'VRF';
const VAR = 'VAR';
const PREALERT = 'PREALERT';
type Props = { router: Router };
type TabValue = 'VRF' | 'VAR' | 'PREALERT';

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
    // const [tab, setTab] = useState<TabValue>(
    //     (router.params.tab as TabValue) ?? VRF,
    // );
    const formik = useFormik({ initialValues: {}, onSubmit: async () => null });

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
                    <Tab key={VRF} value={VRF} label={VRF} />
                    <Tab key={PREALERT} value={PREALERT} label={PREALERT} />
                    <Tab key={VAR} value={VAR} label={VAR} />
                </Tabs>
            </TopBar>
            <Box
                className={classNames(
                    // classes.containerFullHeightNoTabPadded,
                    classes.containerFullHeightPadded,
                    classes.marginTopBig,
                    // classes.root,
                )}
            >
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
                            CANCEL
                        </Button>
                    </Box>
                    <Box ml={2} mt={4}>
                        <Button
                            variant="contained"
                            className={classes.button}
                            color="primary"
                        >
                            SAVE ACTIVE TAB
                        </Button>
                    </Box>
                    <Box ml={2} mt={4}>
                        <Button
                            variant="contained"
                            className={classes.button}
                            color="primary"
                        >
                            SAVE ALL AND CLOSE
                        </Button>
                    </Box>
                </Grid>
            </Box>
        </FormikProvider>
    );
};
