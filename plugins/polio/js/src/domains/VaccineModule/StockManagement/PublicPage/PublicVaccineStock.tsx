import React, { FunctionComponent } from 'react';
import { Box, Button, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { ExcellSvg, useSafeIntl } from 'bluesquare-components';
import { useApiParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useApiParams';
import { useTabs } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useTabs';
import { useUrlParams } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useUrlParams';
import { useParamsObject } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { baseUrls } from '../../../../constants/urls';
import { Filters } from './components/Filters';
import { LanguageButton } from './components/LanguageButton';
import { Table } from './components/Table';
import { TabSwitchButton } from './components/TabSwitchButton';
import { VialsSummary } from './components/VialsSummary';
import MESSAGES from './messages';
import { useGetPublicVaccineStock } from './useGetPublicVaccineStock';

const baseUrl = baseUrls.embeddedVaccineStock;
const useXlsxUrl = allParams => {
    const xlsxApiUrl = '/api/polio/dashboards/public/vaccine_stock/export_xlsx';
    const defaults = {
        order: '-date',
        pageSize: 20,
        page: 1,
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { tab, ...params } = allParams;
    const safeParams = useUrlParams(
        { ...params, app_id: 'com.poliooutbreaks.app' },
        defaults,
    );
    const apiParams = useApiParams(safeParams);
    const queryString = new URLSearchParams(apiParams).toString();
    return `${xlsxApiUrl}/?${queryString}`;
};

const useStyles = makeStyles(theme => ({
    '@global': {
        body: {
            overflowX: 'hidden !important',
            overflowY: 'auto !important',
        },
    },
    icon: {
        height: theme.spacing(3),
        width: 'auto',
        marginRight: theme.spacing(1),
    },
}));

export const PublicVaccineStock: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const params = useParamsObject(baseUrl);
    const { data, isFetching: isLoading } = useGetPublicVaccineStock(params);
    const xlsxUrl = useXlsxUrl(params);
    const { tab, handleChangeTab } = useTabs<'usable' | 'unusable'>({
        params,
        defaultTab: (params?.tab ?? 'usable') as 'usable' | 'unusable',
        baseUrl,
    });
    return (
        <>
            <Box mt={2} mr={2}>
                <Grid container spacing={1} justifyContent="flex-end">
                    <Grid item>
                        <LanguageButton lang="en" />
                    </Grid>
                    <Grid item>
                        <LanguageButton lang="fr" />
                    </Grid>
                </Grid>
            </Box>
            <Box sx={{ border: '1px solid black' }} mx={1} mt={1}>
                <Grid container>
                    <Grid item xs={6}>
                        <Box
                            mt={1}
                            ml={3}
                            sx={{
                                color: '#0a4780',
                                // color: '#094780',
                                fontSize: 32,
                                fontWeight: 'bold',
                                fontFamily: 'arial',
                            }}
                        >
                            <h1>
                                {formatMessage(
                                    MESSAGES.countryStockCards,
                                ).toUpperCase()}
                            </h1>
                        </Box>
                    </Grid>
                    <Grid
                        container
                        item
                        xs={6}
                        spacing={1}
                        justifyContent="flex-end"
                    >
                        <Grid item>
                            <Box mt={1}>
                                <Button
                                    data-test="xlsx-export-button"
                                    variant="contained"
                                    sx={{
                                        backgroundColor: 'black',
                                        color: 'white',
                                        boxShadow: 'none',
                                        borderRadius: 0,
                                        border: '1px solid black',
                                        paddingLeft: '48px',
                                        paddingRight: '48px',
                                        fontWeight: 'bold',
                                        fontSize: '16px',
                                    }}
                                    color="primary"
                                    href={xlsxUrl}
                                    disabled={isLoading}
                                >
                                    <ExcellSvg className={classes.icon} />
                                    XLSX
                                </Button>
                            </Box>
                        </Grid>
                        <Grid item>
                            <Box mt={1}>
                                <TabSwitchButton
                                    tab="usable"
                                    activeTab={tab}
                                    onClick={handleChangeTab}
                                />
                            </Box>
                        </Grid>
                        <Grid item>
                            <Box mr={1} mt={1}>
                                <TabSwitchButton
                                    tab="unusable"
                                    activeTab={tab}
                                    onClick={handleChangeTab}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Grid>
                <Box>
                    <Filters params={params} />
                    <Table
                        data={data}
                        isLoading={isLoading}
                        tab={tab}
                        params={params}
                    />
                    {!isLoading && Boolean(data.results) && (
                        <VialsSummary
                            totalVials={data.results.total_vials}
                            totalDoses={data.results.total_doses}
                            tab={tab}
                        />
                    )}
                </Box>
            </Box>
        </>
    );
};
