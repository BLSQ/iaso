import React, { FunctionComponent } from 'react';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { Box, Tab, Tabs, makeStyles } from '@material-ui/core';
import {
    STOCK_MANAGEMENT,
    STOCK_MANAGEMENT_DETAILS,
} from '../../../../constants/routes';
import { useTabs } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useTabs';
import { Router } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { useGoBack } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/useGoBack';
import { UNUSABLE_VIALS, USABLE_VIALS } from '../constants';
import { TabValue } from '../types';
import TopBar from '../../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import MESSAGES from '../messages';
import { VaccineStockManagementDetailsTable } from './Table/VaccineStockManagementDetailsTable';
import { useGetUnusableVials, useGetUsableVials } from '../hooks/api';

type Props = { router: Router };

const useStyles = makeStyles(theme => {
    return {
        ...commonStyles(theme),
    };
});

export const VaccineStockManagementDetails: FunctionComponent<Props> = ({
    router,
}) => {
    const goBack = useGoBack(router, STOCK_MANAGEMENT);
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const initialTab = (router.params.tab as TabValue) ?? USABLE_VIALS;
    const { tab, handleChangeTab } = useTabs<TabValue>({
        params: router.params,
        defaultTab: initialTab,
        baseUrl: STOCK_MANAGEMENT_DETAILS,
    });
    // Make 1 API call with both usable and not usable + vountry and campaign
    const { data: usableVials, isFetching: isFetchingUsable } =
        useGetUsableVials(router.params, tab === USABLE_VIALS);
    const { data: unUsableVials, isFetching: isFetchingUnusable } =
        useGetUnusableVials(router.params, tab === UNUSABLE_VIALS);

    // This won't work
    // const country =
    //     tab === USABLE_VIALS ? usableVials?.country : unUsableVials?.country;
    // const campaign =
    //     tab === USABLE_VIALS ? usableVials?.campaign : unUsableVials?.campaign;
    return (
        <>
            <TopBar title="title" displayBackButton goBack={goBack}>
                <Tabs
                    value={tab}
                    classes={{
                        root: classes.tabs,
                        indicator: classes.indicator,
                    }}
                    onChange={handleChangeTab}
                >
                    <Tab
                        key={USABLE_VIALS}
                        value={USABLE_VIALS}
                        label={formatMessage(MESSAGES.usable)}
                    />
                    <Tab
                        key={UNUSABLE_VIALS}
                        value={UNUSABLE_VIALS}
                        label={formatMessage(MESSAGES.unusable)}
                    />
                </Tabs>
            </TopBar>
            <Box className={classes.containerFullHeightPadded}>
                <VaccineStockManagementDetailsTable
                    params={router.params}
                    paramsPrefix={tab}
                    data={tab === USABLE_VIALS ? usableVials : unUsableVials}
                    isFetching={
                        tab === USABLE_VIALS
                            ? isFetchingUsable
                            : isFetchingUnusable
                    }
                    tab={tab}
                />
            </Box>
        </>
    );
};
