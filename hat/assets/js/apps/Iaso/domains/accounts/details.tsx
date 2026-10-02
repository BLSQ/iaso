import React, { FunctionComponent } from 'react';
import Edit from '@mui/icons-material/Edit';
import { Box, Grid, Tab, Tabs } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    LinkButton,
    LoadingSpinner,
    useRedirectTo,
    useSafeIntl,
    useTabs,
} from 'bluesquare-components';
import { useApiAccountFeatureFlagsDropdownList } from 'Iaso/api/accountFeatureFlags';
import {
    useApiAccountsAiApiKeyRetrieve,
    useApiAccountsRetrieve,
} from 'Iaso/api/accounts';
import { useApiModulesDropdownList } from 'Iaso/api/modules';
import Page404 from 'Iaso/components/errors/Page404';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { AccountFeatureFlagPanel } from 'Iaso/domains/accounts/components/details/AccountFeatureFlagPanel';
import { CustomTabPanel } from 'Iaso/domains/accounts/components/details/CustomTabPanel';
import { GeneralInfoPanel } from 'Iaso/domains/accounts/components/details/GeneralInfoPanel';
import { ModulePanel } from 'Iaso/domains/accounts/components/details/ModulePanel';
import { useCurrentAccount } from 'Iaso/domains/accounts/hooks';
import { userHasAccessToModule } from 'Iaso/domains/users/utils';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import MESSAGES from './messages';

const a11yProps = (value: string) => {
    return {
        id: `account-tab-${value}`,
        'aria-controls': `account-tabpanel-${value}`,
    };
};

const useStyles = makeStyles((theme: any) => {
    return {
        ...commonStyles(theme),
    };
});

const baseRedirectUrl = `${baseUrls.accounts}`;

const AccountsDetails: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const params = useParamsObject(baseUrls.accountsDetail);

    const accountId = parseInt(params.id);

    const { data: account, isLoading } = useApiAccountsRetrieve(accountId);

    const currentAccount = useCurrentAccount();

    const { data: AIApiKey, isLoading: isLoadingAIApiKey } =
        useApiAccountsAiApiKeyRetrieve(accountId, undefined, {
            query: {
                enabled:
                    Boolean(accountId) &&
                    userHasAccessToModule('FORM_AI', currentAccount),
            },
        });

    const { data: modules, isLoading: isLoadingModules } =
        useApiModulesDropdownList();

    const {
        data: accountFeatureFlags,
        isLoading: isLoadingAccountFeatureFlags,
    } = useApiAccountFeatureFlagsDropdownList();

    const { tab, handleChangeTab } = useTabs({ defaultTab: 'general' });
    const classes: Record<string, string> = useStyles();

    const generalLoading =
        isLoading ||
        isLoadingModules ||
        isLoadingAIApiKey ||
        isLoadingAccountFeatureFlags;

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
            >
                <Tabs
                    textColor="inherit"
                    indicatorColor="secondary"
                    value={tab}
                    onChange={handleChangeTab}
                    aria-label={formatMessage(MESSAGES.accountTabs)}
                    classes={{
                        root: classes.tabs,
                        indicator: classes.indicator,
                    }}
                >
                    <Tab
                        label={formatMessage(MESSAGES.accountTabGeneralTitle)}
                        {...a11yProps('general')}
                        value={'general'}
                    />
                </Tabs>
            </TopBar>

            <MainWrapper sx={{ p: 4 }} navHasTabs>
                <CustomTabPanel index={'general'} value={tab} spacing={2}>
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
                        <Box
                            sx={{
                                justifyContent: 'flex-end',
                                display: 'flex',
                            }}
                        >
                            <LinkButton
                                to={`/${baseUrls.accountsEdit}/id/${params.id}/`}
                            >
                                <Edit className={classes.buttonIcon} />
                                {formatMessage(MESSAGES.edit)}
                            </LinkButton>
                        </Box>
                    </Grid>
                </CustomTabPanel>
            </MainWrapper>
        </>
    );
};
export default AccountsDetails;
