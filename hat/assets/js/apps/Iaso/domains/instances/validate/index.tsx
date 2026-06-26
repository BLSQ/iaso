import React from 'react';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, UrlParams } from 'bluesquare-components';
import { useApiDiffInstancesList } from 'Iaso/api/instanceDiff';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { InstanceDetailRaw } from '../compare/components/InstanceDetailRaw';
import { InstanceLogDetail } from '../compare/components/InstanceLogDetail';
import { InstanceLogInfos } from '../compare/components/InstanceLogInfos';
import { useGetInstance } from '../hooks/requests/useGetInstance';
import { ValidationPaper } from './components/ValidationPaper/ValidationPaper';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

type Params = {
    accountId: string;
    instanceId: string;
} & Partial<UrlParams>;

const diffParams = {
    limit: 2,
    page: 1,
    order: '-created_at',
};

export const ValidateInstance = () => {
    const params: Params = useParamsObject(
        baseUrls.instanceValidation,
    ) as Params;
    const classes = useStyles();
    const { data: instance, isLoading: isLoadingInstance } = useGetInstance(
        params.instanceId,
        {
            cacheTime: Infinity,
            staleTime: Infinity,
        },
    );
    const {
        data: diff,
        isLoading: isLoadingDiff,
        isError,
    } = useApiDiffInstancesList(params.instanceId, diffParams);
    const displaySingleInstance = !diff && !isLoadingInstance && instance;
    const displayDiff =
        diff && instance && !isLoadingInstance && !isLoadingDiff;
    console.log('PARAMS', params);
    console.log('DATA', diff);
    console.log('INSTANCE', instance);
    return (
        <>
            <TopBar displayBackButton={false} />
            <Box className={`${classes.containerFullHeightNoTabPadded}`}>
                <Grid container spacing={2}>
                    {displaySingleInstance && (
                        <Grid item xs={12} sm={8}>
                            <InstanceDetailRaw
                                data={instance}
                                isLoading={isLoadingDiff || isLoadingInstance}
                                isError={isError}
                                showTitle
                            />
                        </Grid>
                    )}
                    {displayDiff && (
                        <Grid container item xs={12} sm={8} spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <InstanceLogDetail
                                    instanceLogContent={
                                        diff.results[0].new_value.fields
                                    }
                                    isLogDetailLoading={isLoadingDiff}
                                    isLogDetailError={isError}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <InstanceLogDetail
                                    instanceLogContent={
                                        diff.results[1].past_value
                                    }
                                    isLogDetailLoading={isLoadingDiff}
                                    isLogDetailError={isError}
                                />
                            </Grid>
                        </Grid>
                    )}
                    {instance && (
                        <Grid item xs={12} sm={4}>
                            <>
                                <ValidationPaper
                                    formName={instance?.form_name ?? ''}
                                    instanceId={instance.id}
                                />
                            </>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </>
    );
};
