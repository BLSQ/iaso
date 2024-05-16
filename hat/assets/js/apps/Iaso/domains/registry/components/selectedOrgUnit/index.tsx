import { Box, Divider, Paper } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { LoadingSpinner, commonStyles } from 'bluesquare-components';
import moment from 'moment';
import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { baseUrls } from '../../../../constants/urls';
import MESSAGES from '../../messages';

import { redirectToReplace } from '../../../../routing/actions';

import InputComponent from '../../../../components/forms/InputComponent';
import InstanceFileContent from '../../../instances/components/InstanceFileContent';

import {
    useGetInstance,
    useGetOrgUnitInstances,
} from '../../hooks/useGetInstances';

import { OrgUnit } from '../../../orgUnits/types/orgUnit';
import { HEIGHT } from '../../config';
import { RegistryParams } from '../../types';
import { EmptyInstances } from './EmptyInstances';
import { InstanceTitle } from './InstanceTitle';
import { OrgUnitTitle } from './OrgUnitTitle';

type Props = {
    orgUnit?: OrgUnit;
    params: RegistryParams;
    isFetching: boolean;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    paper: {
        width: '100%',
        height: HEIGHT,
    },
    formContents: {
        maxHeight: `calc(${HEIGHT} - 222px)`,
        overflow: 'auto',
    },
}));

export const SelectedOrgUnit: FunctionComponent<Props> = ({
    orgUnit,
    params,
    isFetching: isFetchingOrgUnit,
}) => {
    const classes: Record<string, string> = useStyles();
    const dispatch = useDispatch();

    // selected instance should be:
    // submission id from params  OR reference instance OR first submission of the possible ones OR undefined
    // if undefined select should be hidden and a place holder should say no submission

    const currentInstanceId = useMemo(() => {
        return params.submissionId || orgUnit?.reference_instances?.[0]?.id;
    }, [params.submissionId, orgUnit]);

    const { data: currentInstance, isFetching: isFetchingCurrentInstance } =
        useGetInstance(currentInstanceId);
    const { data: instances, isFetching } = useGetOrgUnitInstances(orgUnit?.id);
    const instancesOptions = useMemo(() => {
        return (instances || []).map(instance => ({
            label: `${instance.form_name} (${moment
                .unix(instance.created_at)
                .format('LTS')})`,
            value: instance.id,
        }));
    }, [instances]);

    const handleChange = useCallback(
        (_, submissionId) => {
            const newParams: RegistryParams = {
                ...params,
                submissionId,
            };
            dispatch(redirectToReplace(baseUrls.registry, newParams));
        },
        [params, dispatch],
    );
    if (!orgUnit) {
        return null;
    }

    // console.log('currentInstance', currentInstance);
    // console.log('currentInstanceId', currentInstanceId);
    // console.log('instances', instances);
    return (
        <Box position="relative" width="100%" minHeight={HEIGHT}>
            {(isFetchingCurrentInstance || isFetchingOrgUnit) && (
                <LoadingSpinner absolute />
            )}

            <Paper className={classes.paper}>
                <OrgUnitTitle orgUnit={orgUnit} params={params} />
                <Divider />
                {instances && instances?.length === 0 && <EmptyInstances />}
                {instances && instances?.length > 0 && (
                    <Box
                        width="100%"
                        display="flex"
                        justifyContent="flex-end"
                        mb={2}
                        px={2}
                    >
                        <Box width="50%">
                            <InputComponent
                                type="select"
                                disabled={
                                    isFetching || instancesOptions.length <= 1
                                }
                                keyValue="instance"
                                onChange={handleChange}
                                value={
                                    isFetching ? undefined : currentInstanceId
                                }
                                label={MESSAGES.submission}
                                options={instancesOptions}
                                loading={isFetching}
                                clearable={false}
                            />
                        </Box>
                    </Box>
                )}

                {instances && instances?.length > 0 && currentInstance && (
                    <Divider />
                )}
                {currentInstance && (
                    <>
                        <InstanceTitle
                            currentInstance={currentInstance}
                            orgUnit={orgUnit}
                        />
                        <Divider />
                        <Box className={classes.formContents}>
                            <InstanceFileContent
                                instance={currentInstance}
                                showQuestionKey={false}
                            />
                        </Box>
                    </>
                )}
            </Paper>
        </Box>
    );
};
