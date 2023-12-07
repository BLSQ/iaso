import React, { FunctionComponent } from 'react';
import {
    commonStyles,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';
import { Box, Tab, Tabs, makeStyles } from '@material-ui/core';
import {
    STOCK_MANAGEMENT,
    STOCK_MANAGEMENT_DETAILS,
} from '../../../../constants/routes';
import { useTabs } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useTabs';
import { Router } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { useGoBack } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/useGoBack';
import { UNUSABLE_VIALS, USABLE_VIALS } from '../constants';
import { StockManagementDetailsParams, TabValue } from '../types';
import TopBar from '../../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import MESSAGES from '../messages';
import { VaccineStockManagementDetailsTable } from './Table/VaccineStockManagementDetailsTable';
import {
    useGetStockManagementSummary,
    useGetUnusableVials,
    useGetUsableVials,
} from '../hooks/api';
import { VaccineStockManagementSummary } from './Summary/VaccineStockManagementSummary';

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
        useGetUsableVials(
            router.params as StockManagementDetailsParams,
            tab === USABLE_VIALS,
        );
    const { data: unUsableVials, isFetching: isFetchingUnusable } =
        useGetUnusableVials(
            router.params as StockManagementDetailsParams,
            tab === UNUSABLE_VIALS,
        );
    const { data: summary, isLoading: isLoadingSummary } =
        useGetStockManagementSummary(router.params.id);
    const title = `${formatMessage(MESSAGES.stockDetails)}: ${
        summary?.country_name ?? textPlaceholder
    } - ${summary?.vaccine_type ?? textPlaceholder}`;
    return (
        <>
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
                <VaccineStockManagementSummary
                    isLoading={isLoadingSummary}
                    data={summary}
                />
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
