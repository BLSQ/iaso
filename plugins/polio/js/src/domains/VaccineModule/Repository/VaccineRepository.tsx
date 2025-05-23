import React, { FunctionComponent, useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import {
    MENU_HEIGHT_WITHOUT_TABS,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import { useLocation } from 'react-router-dom';
import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { OffLineLangSwitch } from '../../../../../../../hat/assets/js/apps/Iaso/domains/home/components/LangSwitch';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { SxStyles } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { baseUrls } from '../../../constants/urls';
import { Forms } from './forms';
import MESSAGES from './messages';
import { Reports } from './reports';
import { VaccineRepositoryParams } from './types';

const baseUrl = baseUrls.vaccineRepository;
const embeddedVaccineRepositoryUrl = baseUrls.embeddedVaccineRepository;

const styles: SxStyles = {
    container: {
        width: '100%',
        padding: {
            xs: 2,
            md: 4,
        },
        margin: 0,
        overflow: 'auto',
        backgroundColor: 'white',
        // '& td': { padding: 0 },
    },
};

// Campaigns status filter should be on another ticket with better specs
// What about the colors, what does green says ?
// Which dates should we take (start date, end date, creation date, upload date)
// What about the rounds (count type or count number)
// Which campaigns are displayed ? All ? Or only the ones with a VRF ?

export const VaccineRepository: FunctionComponent = () => {
    const location = useLocation();
    const isEmbedded = location.pathname.includes(embeddedVaccineRepositoryUrl);
    const redirectUrl = isEmbedded ? embeddedVaccineRepositoryUrl : baseUrl;
    const params = useParamsObject(
        redirectUrl,
    ) as unknown as VaccineRepositoryParams;
    const redirectTo = useRedirectTo();
    const [tab, setTab] = useState(params.tab ?? 'forms');
    const { formatMessage } = useSafeIntl();
    const handleChangeTab = (newTab: string) => {
        setTab(newTab);
        const newParams = {
            ...params,
            tab: newTab,
        };
        redirectTo(redirectUrl, newParams);
    };

    return (
        <>
            {!isEmbedded && (
                <TopBar
                    title={formatMessage(MESSAGES.title)}
                    displayBackButton={false}
                />
            )}
            <Box
                sx={styles.container}
                height={
                    isEmbedded
                        ? '100vh'
                        : `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px)`
                }
            >
                {isEmbedded && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Typography variant="h4" color="primary" sx={{ mb: 2 }}>
                            {formatMessage(MESSAGES.title)}
                        </Typography>
                        <Box sx={{ display: 'flex' }} mt={1}>
                            <OffLineLangSwitch />
                        </Box>
                    </Box>
                )}

                <Tabs
                    textColor="inherit"
                    indicatorColor="secondary"
                    value={tab}
                    onChange={(_, newtab) => handleChangeTab(newtab)}
                >
                    <Tab value="forms" label={formatMessage(MESSAGES.forms)} />
                    <Tab
                        value="reports"
                        label={formatMessage(MESSAGES.reports)}
                    />
                </Tabs>
                {tab === 'forms' && <Forms params={params} />}
                {tab === 'reports' && <Reports params={params} />}
            </Box>
        </>
    );
};
