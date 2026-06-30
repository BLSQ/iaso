import React, { useMemo, useState } from 'react';
import { Box, FormControlLabel, FormGroup, Grid, Switch } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, UrlParams, useSafeIntl } from 'bluesquare-components';
import { cloneDeep } from 'lodash';
import { useApiDiffInstancesList } from 'Iaso/api/instanceDiff';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import {
    formatLogContent,
    LogContentSource,
} from '../compare/components/CompareInstanceLogs';
import { InstanceDetailRaw } from '../compare/components/InstanceDetailRaw';
import { InstanceLogDetail } from '../compare/components/InstanceLogDetail';
import { useGetInstance } from '../hooks/requests/useGetInstance';
import { ValidationPaper } from './components/ValidationPaper/ValidationPaper';
import MESSAGES from './messages';

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

type DiffModification = LogContentSource & {
    diff?: Array<{ path: string }>;
};

const removeObjectEntries = (
    list: string[],
    obj: Record<string, any>,
): Record<string, any> => {
    const result: Record<string, any> = {};
    const objKeys = Object.keys(obj);
    objKeys.forEach(key => {
        if (list.includes(key)) {
            result[key] = obj[key];
        }
    });
    return result;
};

export const ValidateInstance = () => {
    const params: Params = useParamsObject(
        baseUrls.instanceValidation,
    ) as Params;
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const [showAllFields, setShowAllFields] = useState<boolean>(false);
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
    const diffContent = useMemo(() => {
        if (diff?.results && showAllFields) {
            return formatLogContent(diff?.results?.[1], diff?.results?.[0]);
        } else if ((diff?.results ?? [])?.length > 0) {
            const previous = cloneDeep(diff.results[1]);
            const current = cloneDeep(diff.results[0]);
            const changedKeys = (diff?.results?.[0]?.diff ?? []).map(
                diffObj =>
                    diffObj.path.split('/')[diffObj.path.split('/').length - 1],
            );

            current.new_value[0].fields.json = removeObjectEntries(
                changedKeys,
                {
                    ...diff.results[0].new_value[0].fields.json,
                },
            );
            previous.new_value[0].fields.json = removeObjectEntries(
                changedKeys,
                {
                    ...diff.results[1].new_value[0].fields.json,
                },
            );
            current.possible_fields = current.possible_fields.filter(field =>
                changedKeys.includes(field.name),
            );

            return formatLogContent(previous, current);
        }
        return {};
    }, [diff, showAllFields]);

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
                        <Grid item xs={12} sm={8}>
                            <InstanceLogDetail
                                instanceLogContent={diffContent}
                                isLogDetailLoading={!displayDiff}
                                isLogDetailError={isError}
                                headerA={MESSAGES.previous}
                                headerB={MESSAGES.current}
                            />
                            <FormGroup>
                                <FormControlLabel
                                    style={{ width: 'max-content' }}
                                    control={
                                        <Switch
                                            size="medium"
                                            checked={showAllFields}
                                            onChange={() =>
                                                setShowAllFields(!showAllFields)
                                            }
                                            color="primary"
                                        />
                                    }
                                    label={formatMessage(
                                        MESSAGES.toggleShowAllFields,
                                    )}
                                />
                            </FormGroup>
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
