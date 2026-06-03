import React, { useState } from 'react';
import Edit from '@mui/icons-material/Edit';
import { Box, Grid, Tab, Tabs } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    LinkButton,
    LoadingSpinner,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import { useApiAccountFeatureFlagsDropdownList } from 'Iaso/api/accountFeatureFlags';
import {
    useApiAccountsAiApiKeyRetrieve,
    useApiAccountsRetrieve,
} from 'Iaso/api/accounts';
import Page404 from 'Iaso/components/errors/Page404';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { AccountFeatureFlagPanel } from 'Iaso/domains/accounts/components/details/AccountFeatureFlagPanel';
import { CustomTabPanel } from 'Iaso/domains/accounts/components/details/CustomTabPanel';
import { GeneralInfoPanel } from 'Iaso/domains/accounts/components/details/GeneralInfoPanel';
import { ModulePanel } from 'Iaso/domains/accounts/components/details/ModulePanel';
import { useGetModulesDropDown } from 'Iaso/domains/setup/hooks/useGetModulesDropDown';
import { userHasAccessToModule } from 'Iaso/domains/users/utils';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import MESSAGES from './messages';

function a11yProps(value: string) {
    return {
        id: `account-tab-${value}`,
        'aria-controls': `account-tabpanel-${value}`,
    };
}

const useStyles = makeStyles((theme: any) => {
    return { ...commonStyles(theme) };
});
const AccountsDetails = () => {
    const { formatMessage } = useSafeIntl();
    const params = useParamsObject(baseUrls.accountsDetail);

    const accountId = parseInt(params.id);

    const { data: account, isLoading } = useApiAccountsRetrieve(
        parseInt(params.id),
        undefined,
        { query: { enabled: !!accountId } },
    );

    const user = useCurrentUser();

    const { data: AIApiKey, isLoading: isLoadingAIApiKey } =
        useApiAccountsAiApiKeyRetrieve(accountId, undefined, {
            query: {
                enabled: !!accountId && userHasAccessToModule('FORM_AI', user),
            },
        });

    const { data: modules, isLoading: isLoadingModules } =
        useGetModulesDropDown();

    const {
        data: accountFeatureFlags,
        isLoading: isLoadingAccountFeatureFlags,
    } = useApiAccountFeatureFlagsDropdownList();

    const [tab, setTab] = useState('general');
    const classes: Record<string, string> = useStyles();

    const generalLoading =
        isLoading ||
        isLoadingModules ||
        isLoadingAIApiKey ||
        isLoadingAccountFeatureFlags;

    const handleChange = (_: React.SyntheticEvent, newValue: string) => {
        setTab(newValue);
    };

    const baseRedirectUrl = `${baseUrls.accounts}`;
    const redirectTo = useRedirectTo();

    if (generalLoading) {
        return (
            <>
                <TopBar
                    title={formatMessage(MESSAGES.accounts)}
                    displayBackButton
                    goBack={() => redirectTo(baseRedirectUrl)}
                />
                <LoadingSpinner />
            </>
        );
    }

    if (!account) {
        return <Page404 displayTopBar={true} />;
    }

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.accounts)}
                displayBackButton
                goBack={() => redirectTo(baseRedirectUrl)}
            />

            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                <Grid container spacing={2} direction={'column'}>
                    <Grid
                        item
                        xs={12}
                        sx={{ justifyContent: 'flex-end', display: 'flex' }}
                    >
                        <LinkButton
                            to={`/${baseUrls.accountsEdit}/id/${params.id}/`}
                        >
                            <Edit className={classes.buttonIcon} />
                            {formatMessage(MESSAGES.edit)}
                        </LinkButton>
                    </Grid>
                    <Grid item xs={12}>
                        <Tabs
                            value={tab}
                            onChange={handleChange}
                            aria-label={formatMessage(MESSAGES.accountTabs)}
                            sx={{ mb: 3 }}
                        >
                            <Tab
                                label={formatMessage(
                                    MESSAGES.accountTabGeneralTitle,
                                )}
                                {...a11yProps('general')}
                                value={'general'}
                                sx={{
                                    typography: 'h5',
                                }}
                            />
                        </Tabs>
                        <CustomTabPanel
                            index={'general'}
                            value={tab}
                            spacing={2}
                        >
                            <Grid xs={12} md={6} item>
                                <GeneralInfoPanel
                                    accountId={accountId}
                                    account={account}
                                    AIApiKey={AIApiKey}
                                />
                                <AccountFeatureFlagPanel
                                    accountId={accountId}
                                    accountFeatureFlags={accountFeatureFlags}
                                    account={account}
                                />
                            </Grid>
                            <Grid xs={12} md={6} item>
                                <ModulePanel
                                    accountId={accountId}
                                    account={account}
                                    modules={modules}
                                />
                            </Grid>
                        </CustomTabPanel>
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};
export default AccountsDetails;
