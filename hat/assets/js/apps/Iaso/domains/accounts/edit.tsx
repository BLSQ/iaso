import React, { FunctionComponent } from 'react';
import { Alert, Box, Button, Grid } from '@mui/material';
import {
    LoadingSpinner,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import { LinkButton } from 'bluesquare-components';
import { FormikProvider, useFormik } from 'formik';
import { useQueryClient } from 'react-query';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { useApiAccountFeatureFlagsDropdownList } from 'Iaso/api/accountFeatureFlags';
import {
    ApiAccountsUpdateBody,
    getApiAccountsAiApiKeyRetrieveQueryKey,
    getApiAccountsMeRetrieveQueryKey,
    useApiAccountsRetrieve,
    useApiAccountsUpdate,
} from 'Iaso/api/accounts';
import { useApiModulesDropdownList } from 'Iaso/api/modules';
import Page404 from 'Iaso/components/errors/Page404';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { FeatureFlagsEditPanel } from 'Iaso/domains/accounts/components/edit/FeatureFlagsEditPanel';
import { GeneralInfoEditPanel } from 'Iaso/domains/accounts/components/edit/GeneralInfoEditPanel';
import { ModulesEditPanel } from 'Iaso/domains/accounts/components/edit/ModulesEditPanel';
import { useCurrentAccount } from 'Iaso/domains/accounts/hooks';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { withFormikSubmitAsync } from 'Iaso/utils/forms';
import MESSAGES from './messages';

export const AccountsEdit: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const params = useParamsObject(baseUrls.accountsEdit);
    const currentAccount = useCurrentAccount();

    const accountId = parseInt(params.id);

    const { data: data, isLoading } = useApiAccountsRetrieve(accountId);
    const { data: modulesData, isLoading: isLoadingModules } =
        useApiModulesDropdownList();
    const {
        data: accountFeatureFlags,
        isLoading: isLoadingAccountFeatureFlags,
    } = useApiAccountFeatureFlagsDropdownList();

    const initialData = React.useMemo(() => {
        if (!data) return { name: '' }; // just for TS compliance as name is required

        const { id: _id, created_at: _createdAt, ...rest } = data;
        return {
            ...rest,
            feature_flags: rest?.feature_flags?.map(({ code }) => code),
        };
    }, [data]);
    const redirectTo = useRedirectTo();

    const redirectBackUrl: string = `${baseUrls.accountsDetail}/id/${params.id}/`;

    const { mutateAsync: save } = useApiAccountsUpdate({
        mutation: {
            onSuccess: (_data, variables) => {
                if (accountId === currentAccount?.id) {
                    queryClient.invalidateQueries(
                        getApiAccountsMeRetrieveQueryKey(),
                    );
                }
                if (
                    accountId === currentAccount?.id &&
                    variables.data.modules?.includes('FORM_AI') &&
                    !data?.modules?.includes('FORM_AI')
                ) {
                    queryClient.invalidateQueries(
                        getApiAccountsAiApiKeyRetrieveQueryKey(accountId),
                    );
                }
                redirectTo(redirectBackUrl);
            },
            meta: {
                ignoreErrorCodes: [400],
            },
        },
    });
    const queryClient = useQueryClient();

    const formik = useFormik<ApiAccountsUpdateBody>({
        validationSchema: toFormikValidationSchema(ApiAccountsUpdateBody),
        initialValues: initialData,
        validateOnBlur: true,
        enableReinitialize: true,
        onSubmit: withFormikSubmitAsync(values =>
            save({ id: accountId, data: values }),
        ),
    });

    const generalLoading =
        isLoading || isLoadingModules || isLoadingAccountFeatureFlags;

    const allowConfirm =
        formik.isValid && formik.dirty && !!accountId && !formik.isSubmitting;

    if (generalLoading) {
        return (
            <>
                <TopBar
                    title={formatMessage(MESSAGES.editAccount)}
                    goBack={() => redirectTo(redirectBackUrl)}
                    displayBackButton
                />
                <LoadingSpinner />
            </>
        );
    }
    if (!generalLoading && !data) {
        return <Page404 displayTopBar={true} />;
    }

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.editAccount)}
                goBack={() => redirectTo(redirectBackUrl)}
                displayBackButton
            />
            <MainWrapper sx={{ p: 4 }}>
                <FormikProvider value={formik}>
                    {formik.status && (
                        <Alert severity={'error'} sx={{ mb: 2 }}>
                            {formik.status}
                        </Alert>
                    )}
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <GeneralInfoEditPanel />
                            <FeatureFlagsEditPanel
                                accountFeatureFlags={accountFeatureFlags}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <ModulesEditPanel modules={modulesData} />
                            <Box
                                sx={{
                                    justifyContent: 'flex-end',
                                    display: 'flex',
                                }}
                            >
                                <LinkButton
                                    to={`/${baseUrls.accountsDetail}/id/${params.id}/`}
                                    color={'error'}
                                >
                                    {formatMessage(MESSAGES.cancel)}
                                </LinkButton>
                                <Button
                                    variant="contained"
                                    type={'submit'}
                                    color={'success'}
                                    disabled={!allowConfirm}
                                    sx={{ ml: 2 }}
                                    onClick={() =>
                                        allowConfirm && formik.handleSubmit()
                                    }
                                >
                                    {formatMessage(MESSAGES.save)}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </FormikProvider>
            </MainWrapper>
        </>
    );
};
