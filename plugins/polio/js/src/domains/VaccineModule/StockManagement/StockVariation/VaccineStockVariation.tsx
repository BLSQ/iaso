import React, { FunctionComponent } from 'react';
import {
    commonStyles,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';
import { Grid, Box, Paper, Tab, Tabs, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    STOCK_MANAGEMENT_DETAILS,
    STOCK_VARIATION,
} from '../../../../constants/routes';
import { useTabs } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useTabs';
import { Router } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { useGoBack } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/useGoBack';
import { DESTRUCTION, FORM_A, INCIDENT } from '../constants';
import { StockVariationParams, StockVariationTab } from '../types';
import TopBar from '../../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import MESSAGES from '../messages';

import { VaccineStockVariationTable } from './Table/VaccineStockVariationTable';
import {
    useGetDestructionList,
    useGetFormAList,
    useGetIncidentList,
    useGetStockManagementSummary,
} from '../hooks/api';
import {
    useDestructionTableColumns,
    useFormATableColumns,
    useIncidentTableColumns,
} from './Table/columns';
import { CreateFormA } from './Modals/CreateEditFormA';
import { CreateDestruction } from './Modals/CreateEditDestruction';
import { CreateIncident } from './Modals/CreateEditIncident';

type Props = { router: Router };

const useStyles = makeStyles(theme => {
    return {
        ...commonStyles(theme),
        marginTop: {
            marginTop: theme.spacing(2),
        },
    };
});

export const VaccineStockVariation: FunctionComponent<Props> = ({ router }) => {
    const goBack = useGoBack(router, STOCK_MANAGEMENT_DETAILS, {
        id: router.params.id as string,
    });
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const initialTab = (router.params.tab as StockVariationTab) ?? FORM_A;
    const { tab, handleChangeTab } = useTabs<StockVariationTab>({
        params: router.params,
        defaultTab: initialTab,
        baseUrl: STOCK_VARIATION,
    });

    const { data: formA, isFetching: isFetchingFormA } = useGetFormAList(
        router.params as StockVariationParams,
        tab === FORM_A,
    );
    const { data: destructions, isFetching: isFetchingDestructions } =
        useGetDestructionList(
            router.params as StockVariationParams,
            tab === DESTRUCTION,
        );
    const { data: incidents, isFetching: isFetchingIncidents } =
        useGetIncidentList(
            router.params as StockVariationParams,
            tab === INCIDENT,
        );
    const { data: summary } = useGetStockManagementSummary(router.params.id);

    const title = `${formatMessage(MESSAGES.stockVariation)}: ${
        summary?.country_name ?? textPlaceholder
    } - ${summary?.vaccine_type ?? textPlaceholder}`;
    const formAColumns = useFormATableColumns(
        summary?.country_name,
        summary?.vaccine_type,
    );
    const destructionsColumns = useDestructionTableColumns(
        summary?.country_name,
        summary?.vaccine_type,
    );
    const incidentsColumns = useIncidentTableColumns(
        summary?.country_name,
        summary?.vaccine_type,
    );

    return (
        <>
            <TopBar title={title} displayBackButton goBack={goBack}>
                <Tabs
                    value={tab}
                    classes={{
                        root: classes.tabs,
                        indicator: classes.indicator,
                    }}
                    textColor="inherit"
                    indicatorColor="secondary"
                    onChange={handleChangeTab}
                >
                    <Tab
                        key={FORM_A}
                        value={FORM_A}
                        label={formatMessage(MESSAGES.formA)}
                    />
                    <Tab
                        key={DESTRUCTION}
                        value={DESTRUCTION}
                        label={formatMessage(MESSAGES.destructionReports)}
                    />
                    <Tab
                        key={INCIDENT}
                        value={INCIDENT}
                        label={formatMessage(MESSAGES.incidentReports)}
                    />
                </Tabs>
            </TopBar>
            <Box className={classes.containerFullHeightPadded}>
                <Paper elevation={2} className={classes.marginTop}>
                    <Box padding={2}>
                        <Grid container justifyContent="space-between">
                            <Typography variant="h5" color="primary">
                                {formatMessage(MESSAGES[`${tab}Reports`])}
                            </Typography>
                            {tab === FORM_A && (
                                <CreateFormA
                                    iconProps={{}}
                                    countryName={summary?.country_name}
                                    vaccine={summary?.vaccine_type}
                                />
                            )}
                            {tab === DESTRUCTION && (
                                <CreateDestruction
                                    iconProps={{}}
                                    countryName={summary?.country_name}
                                    vaccine={summary?.vaccine_type}
                                />
                            )}
                            {tab === INCIDENT && (
                                <CreateIncident
                                    iconProps={{}}
                                    countryName={summary?.country_name}
                                    vaccine={summary?.vaccine_type}
                                />
                            )}
                        </Grid>
                        {tab === FORM_A && (
                            <VaccineStockVariationTable
                                data={formA}
                                columns={formAColumns}
                                params={router.params}
                                paramsPrefix={tab}
                                isFetching={isFetchingFormA}
                                defaultSorted={[
                                    { id: 'form_a_reception_date', desc: true },
                                ]}
                            />
                        )}
                        {tab === DESTRUCTION && (
                            <VaccineStockVariationTable
                                data={destructions}
                                columns={destructionsColumns}
                                params={router.params}
                                paramsPrefix={tab}
                                isFetching={isFetchingDestructions}
                                defaultSorted={[
                                    {
                                        id: 'destruction_reception_rrt',
                                        desc: true,
                                    },
                                ]}
                            />
                        )}
                        {tab === INCIDENT && (
                            <VaccineStockVariationTable
                                data={incidents}
                                columns={incidentsColumns}
                                params={router.params}
                                paramsPrefix={tab}
                                isFetching={isFetchingIncidents}
                                defaultSorted={[
                                    {
                                        id: 'incident_report_received_by_rrt',
                                        desc: true,
                                    },
                                ]}
                            />
                        )}
                    </Box>
                </Paper>
            </Box>
        </>
    );
};
