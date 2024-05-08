import React, { FunctionComponent } from 'react';
import {
    UrlParams,
    commonStyles,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';
import { Grid, Box, Paper, Tab, Tabs, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { STOCK_MANAGEMENT_WRITE } from '../../../../constants/permissions';
import { DisplayIfUserHasPerm } from '../../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import { baseUrls } from '../../../../constants/urls';
import { useParamsObject } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { useTabs } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useTabs';
import { useGoBack } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useGoBack';
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

const useStyles = makeStyles(theme => {
    return {
        ...commonStyles(theme),
        marginTop: {
            marginTop: theme.spacing(2),
        },
    };
});

const baseUrl = baseUrls.stockVariation;

type VaccineStockVariationParams = Partial<UrlParams> & StockVariationParams;

export const VaccineStockVariation: FunctionComponent = () => {
    const params = useParamsObject(baseUrl) as VaccineStockVariationParams;
    const goBack = useGoBack(
        `${baseUrls.stockManagementDetails}/id/${params.id}`,
        true,
    );
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const initialTab = (params.tab as StockVariationTab) ?? FORM_A;
    const { tab, handleChangeTab } = useTabs<StockVariationTab>({
        params,
        defaultTab: initialTab,
        baseUrl,
    });

    const { data: formA, isFetching: isFetchingFormA } = useGetFormAList(
        params,
        tab === FORM_A,
    );
    const { data: destructions, isFetching: isFetchingDestructions } =
        useGetDestructionList(params, tab === DESTRUCTION);
    const { data: incidents, isFetching: isFetchingIncidents } =
        useGetIncidentList(params, tab === INCIDENT);
    const { data: summary } = useGetStockManagementSummary(params.id);
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
                            <DisplayIfUserHasPerm
                                permissions={[STOCK_MANAGEMENT_WRITE]}
                            >
                                {tab === FORM_A && (
                                    <CreateFormA
                                        iconProps={{}}
                                        countryName={summary?.country_name}
                                        vaccine={summary?.vaccine_type}
                                        vaccineStockId={params.id as string}
                                    />
                                )}
                            </DisplayIfUserHasPerm>
                            <DisplayIfUserHasPerm
                                permissions={[STOCK_MANAGEMENT_WRITE]}
                            >
                                {tab === DESTRUCTION && (
                                    <CreateDestruction
                                        iconProps={{}}
                                        countryName={summary?.country_name}
                                        vaccine={summary?.vaccine_type}
                                        vaccineStockId={params.id as string}
                                    />
                                )}
                            </DisplayIfUserHasPerm>
                            <DisplayIfUserHasPerm
                                permissions={[STOCK_MANAGEMENT_WRITE]}
                            >
                                {tab === INCIDENT && (
                                    <CreateIncident
                                        iconProps={{}}
                                        countryName={summary?.country_name}
                                        vaccine={summary?.vaccine_type}
                                        vaccineStockId={params.id as string}
                                    />
                                )}
                            </DisplayIfUserHasPerm>
                        </Grid>
                        {tab === FORM_A && (
                            <VaccineStockVariationTable
                                data={formA}
                                columns={formAColumns}
                                params={params}
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
                                params={params}
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
                                params={params}
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
