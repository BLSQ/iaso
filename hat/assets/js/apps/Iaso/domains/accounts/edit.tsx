import React from 'react';
import { Alert, Box, Button, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    LoadingSpinner,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';
import { FormikProvider, useFormik } from 'formik';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { useApiAccountFeatureFlagsDropdownList } from 'Iaso/api/accountFeatureFlags';
import {
    ApiAccountsUpdateBody,
    useApiAccountsRetrieve,
    useApiAccountsUpdate,
} from 'Iaso/api/accounts';
import Page404 from 'Iaso/components/errors/Page404';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { FeatureFlagsEditPanel } from 'Iaso/domains/accounts/components/edit/FeatureFlagsEditPanel';
import { GeneralInfoEditPanel } from 'Iaso/domains/accounts/components/edit/GeneralInfoEditPanel';
import { ModulesEditPanel } from 'Iaso/domains/accounts/components/edit/ModulesEditPanel';
import { useGetModulesDropDown } from 'Iaso/domains/setup/hooks/useGetModulesDropDown';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { withFormikSubmitAsync } from 'Iaso/utils/forms';
import MESSAGES from './messages';

const useStyles = makeStyles((theme: any) => {
    return { ...commonStyles(theme) };
});
export const AccountsEdit = () => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const params = useParamsObject(baseUrls.accountsEdit);

    const accountId = parseInt(params.id);

    const { data: data, isLoading } = useApiAccountsRetrieve(accountId);
    const { data: modulesData, isLoading: isLoadingModules } =
        useGetModulesDropDown();
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

    const { mutateAsync: save } = useApiAccountsUpdate({
        mutation: {
            onSuccess: () => {
                redirectTo(`${baseUrls.accountsDetail}/id/${params.id}/`);
            },
            ignoreErrorCodes: [400],
        },
    });

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

    const allowConfirm = formik.isValid && formik.dirty && !!accountId;

    if (generalLoading) {
        return (
            <>
                <TopBar title={formatMessage(MESSAGES.editAccount)} />
                <LoadingSpinner />
            </>
        );
    }
    if (!generalLoading && !data) {
        return <Page404 displayTopBar={true} />;
    }

    return (
        <>
            <TopBar title={formatMessage(MESSAGES.editAccount)} />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                <FormikProvider value={formik}>
                    {formik.status && (
                        <Alert severity={'error'} sx={{ mb: 2 }}>
                            {formik.status}
                        </Alert>
                    )}
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <GeneralInfoEditPanel />
                            <FeatureFlagsEditPanel
                                accountFeatureFlags={accountFeatureFlags}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <ModulesEditPanel modules={modulesData} />
                        </Grid>
                        <Grid
                            item
                            xs={12}
                            sx={{
                                justifyContent: 'space-between',
                                display: 'flex',
                            }}
                        >
                            <Button
                                variant="contained"
                                type={'button'}
                                color={'error'}
                                href={`/dashboard/${baseUrls.accountsDetail}/id/${params.id}/`}
                            >
                                {formatMessage(MESSAGES.cancel)}
                            </Button>
                            <Button
                                variant="contained"
                                type={'submit'}
                                color={'success'}
                                disabled={!allowConfirm}
                                onClick={() =>
                                    allowConfirm && formik.handleSubmit()
                                }
                            >
                                {formatMessage(MESSAGES.save)}
                            </Button>
                        </Grid>
                    </Grid>
                </FormikProvider>
            </Box>
        </>
    );
};
