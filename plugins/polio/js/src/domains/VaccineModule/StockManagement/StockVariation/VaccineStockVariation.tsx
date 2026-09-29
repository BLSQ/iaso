import React, { FunctionComponent } from 'react';
import { Box, Grid, Paper, Tab, Tabs, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    UrlParams,
    commonStyles,
    textPlaceholder,
    useGoBack,
    useSafeIntl,
} from 'bluesquare-components';
import { DisplayIfUserHasPerm } from '../../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import TopBar from '../../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useTabs } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useTabs';
import { useParamsObject } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import {
    STOCK_MANAGEMENT_WRITE,
    STOCK_MANAGEMENT_READ,
    STOCK_EARMARKS_NONADMIN,
    STOCK_EARMARKS_ADMIN,
} from '../../../../constants/permissions';
import { baseUrls } from '../../../../constants/urls';
import { DESTRUCTION, EARMARKED, FORM_A, INCIDENT } from '../constants';
import {
    useGetDosesOptions,
    useGetStockManagementSummary,
} from '../hooks/api';
import MESSAGES from '../messages';
import { StockVariationParams, StockVariationTab } from '../types';

import { useStockVariationTabConfig } from './config';
import { CreateDestruction } from './Modals/CreateEditDestruction';
import { CreateEarmarked } from './Modals/CreateEditEarmarked';
import { CreateFormA } from './Modals/CreateEditFormA';
import { CreateIncident } from './Modals/CreateEditIncident';
import { StockVariationSearch } from './Modals/StockVariationSearch';
import { VaccineStockVariationTable } from './Table/VaccineStockVariationTable';

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
    const params = useParamsObject(
        baseUrl,
    ) as unknown as VaccineStockVariationParams;
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

    const { data: dosesOptions } = useGetDosesOptions(parseInt(params.id, 10));
    const hasUsableStock =
        dosesOptions?.some(option => option.doses_available > 0) ?? false;
    const hasUnusableStock =
        dosesOptions?.some(option => option.unusable_doses > 0) ?? false;
    const defaultDosesPerVial =
        //@ts-ignore
        (dosesOptions ?? []).length === 1 ? dosesOptions[0].value : undefined;
    const { data: summary } = useGetStockManagementSummary(params.id);
    const title = `${formatMessage(MESSAGES.stockVariation)}: ${
        summary?.country_name ?? textPlaceholder
    } - ${summary?.vaccine_type ?? textPlaceholder}`;

    const currentTabConfig = useStockVariationTabConfig({
        params,
        tab,
        countryName: summary?.country_name,
        vaccineType: summary?.vaccine_type,
    });

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
                    <Tab
                        key={EARMARKED}
                        value={EARMARKED}
                        label={formatMessage(MESSAGES.earmarked)}
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
                                permissions={[
                                    STOCK_MANAGEMENT_WRITE,
                                    STOCK_MANAGEMENT_READ,
                                ]}
                            >
                                {tab === FORM_A && (
                                    <CreateFormA
                                        iconProps={{
                                            disabled: !hasUsableStock,
                                        }}
                                        countryName={summary?.country_name}
                                        vaccine={summary?.vaccine_type}
                                        vaccineStockId={params.id as string}
                                        dosesOptions={dosesOptions}
                                        defaultDosesPerVial={
                                            defaultDosesPerVial
                                        }
                                    />
                                )}
                            </DisplayIfUserHasPerm>
                            <DisplayIfUserHasPerm
                                permissions={[
                                    STOCK_MANAGEMENT_WRITE,
                                    STOCK_MANAGEMENT_READ,
                                ]}
                            >
                                {tab === DESTRUCTION && (
                                    <CreateDestruction
                                        iconProps={{
                                            disabled: !hasUnusableStock,
                                        }}
                                        countryName={summary?.country_name}
                                        vaccine={summary?.vaccine_type}
                                        vaccineStockId={params.id as string}
                                        dosesOptions={dosesOptions}
                                        defaultDosesPerVial={
                                            defaultDosesPerVial
                                        }
                                    />
                                )}
                            </DisplayIfUserHasPerm>
                            <DisplayIfUserHasPerm
                                permissions={[
                                    STOCK_MANAGEMENT_WRITE,
                                    STOCK_MANAGEMENT_READ,
                                ]}
                            >
                                {tab === INCIDENT && (
                                    <CreateIncident
                                        iconProps={{}}
                                        countryName={summary?.country_name}
                                        vaccine={summary?.vaccine_type}
                                        vaccineStockId={params.id as string}
                                        dosesOptions={dosesOptions}
                                        hasUsableStock={hasUsableStock}
                                        hasUnusableStock={hasUnusableStock}
                                        defaultDosesPerVial={
                                            defaultDosesPerVial
                                        }
                                    />
                                )}
                            </DisplayIfUserHasPerm>
                            <DisplayIfUserHasPerm
                                permissions={[
                                    STOCK_EARMARKS_NONADMIN,
                                    STOCK_EARMARKS_ADMIN,
                                ]}
                            >
                                {tab === EARMARKED && (
                                    <CreateEarmarked
                                        iconProps={{
                                            disabled: !hasUsableStock,
                                        }}
                                        countryName={summary?.country_name}
                                        vaccine={summary?.vaccine_type}
                                        vaccineStockId={params.id as string}
                                        dosesOptions={dosesOptions}
                                        defaultDosesPerVial={
                                            defaultDosesPerVial
                                        }
                                    />
                                )}
                            </DisplayIfUserHasPerm>
                        </Grid>
                        {currentTabConfig.search && (
                            <StockVariationSearch
                                params={params}
                                searchKey={currentTabConfig.search.searchKey}
                                pageKey={currentTabConfig.search.pageKey}
                            />
                        )}
                        <VaccineStockVariationTable
                            data={currentTabConfig.data}
                            columns={currentTabConfig.columns}
                            params={params}
                            paramsPrefix={tab}
                            isFetching={currentTabConfig.isFetching}
                            defaultSorted={currentTabConfig.defaultSorted}
                        />
                    </Box>
                </Paper>
            </Box>
        </>
    );
};
