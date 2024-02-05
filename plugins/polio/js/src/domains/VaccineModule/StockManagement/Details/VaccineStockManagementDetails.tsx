import React, { FunctionComponent, useCallback } from 'react';
import {
    commonStyles,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';
import { Box, Button, Grid, Paper, Tab, Tabs, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useDispatch } from 'react-redux';
import { redirectTo } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/actions';
import {
    STOCK_MANAGEMENT,
    STOCK_MANAGEMENT_DETAILS,
    STOCK_VARIATION,
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
        marginTop: {
            marginTop: theme.spacing(2),
        },
        bigMarginTop: {
            marginTop: theme.spacing(4),
        },
    };
});

export const VaccineStockManagementDetails: FunctionComponent<Props> = ({
    router,
}) => {
    const goBack = useGoBack(router, STOCK_MANAGEMENT);
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
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

    const { data: unusableVials, isFetching: isFetchingUnusable } =
        useGetUnusableVials(
            router.params as StockManagementDetailsParams,
            tab === UNUSABLE_VIALS,
        );

    const { data: summary, isLoading: isLoadingSummary } =
        useGetStockManagementSummary(router.params.id);

    const goToStockVariation = useCallback(() => {
        dispatch(
            redirectTo(STOCK_VARIATION, { id: router.params.id as string }),
        );
    }, [dispatch, router.params.id]);

    const title = `${formatMessage(MESSAGES.stockDetails)}: ${
        summary?.country_name ?? textPlaceholder
    } - ${summary?.vaccine_type ?? textPlaceholder}`;

    return (
        <>
            <TopBar title={title} displayBackButton goBack={goBack} />

            <Box className={classes.containerFullHeightPadded}>
                <Grid container>
                    <Grid item xs={12} sm={6} md={4}>
                        <VaccineStockManagementSummary
                            isLoading={isLoadingSummary}
                            data={summary}
                        />
                    </Grid>
                    <Grid
                        container
                        item
                        xs={12}
                        sm={6}
                        md={8}
                        justifyContent="flex-end"
                    >
                        <Box>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={goToStockVariation}
                            >
                                {formatMessage(MESSAGES.stockVariation)}
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
                <Tabs
                    value={tab}
                    classes={{
                        root: classes.bigMarginTop,
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
                <Paper elevation={2} className={classes.marginTop}>
                    <Box pt={2} px={2}>
                        <Typography variant="h5" color="primary">
                            {formatMessage(MESSAGES[tab])}
                        </Typography>

                        {/* Using 2 tables to avoid messing up the Tables internal state, which will create bugs */}
                        {tab === USABLE_VIALS && (
                            <VaccineStockManagementDetailsTable
                                params={router.params}
                                paramsPrefix={tab}
                                data={usableVials}
                                isFetching={isFetchingUsable}
                            />
                        )}
                        {tab === UNUSABLE_VIALS && (
                            <VaccineStockManagementDetailsTable
                                params={router.params}
                                paramsPrefix={tab}
                                data={unusableVials}
                                isFetching={isFetchingUnusable}
                            />
                        )}
                    </Box>
                </Paper>
            </Box>
        </>
    );
};
