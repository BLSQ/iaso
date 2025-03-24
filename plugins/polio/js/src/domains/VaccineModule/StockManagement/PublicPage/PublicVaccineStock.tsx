import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { useTabs } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useTabs';
import { useParamsObject } from '../../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { baseUrls } from '../../../../constants/urls';
import { Filters } from './components/Filters';
import { LanguageButton } from './components/LanguageButton';
import { Table } from './components/Table';
import { TabSwitchButton } from './components/TabSwitchButton';
import MESSAGES from './messages';
import { useGetPublicVaccineStock } from './useGetPublicVaccineStock';

const baseUrl = baseUrls.embeddedVaccineStock;

export const PublicVaccineStock: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const params = useParamsObject(baseUrl);
    const { data, isLoading } = useGetPublicVaccineStock(params);
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
                        <Box mt={1} sx={{ color: 'blue', fontSize: 36 }}>
                            <h1>{formatMessage(MESSAGES.countryStockCards)}</h1>
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
                    <Table data={data} isLoading={isLoading} tab={tab} />
                </Box>
            </Box>
        </>
    );
};
