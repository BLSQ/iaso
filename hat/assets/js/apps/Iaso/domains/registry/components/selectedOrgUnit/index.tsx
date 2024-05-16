import { Box, Divider, Paper } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { LoadingSpinner, commonStyles } from 'bluesquare-components';
import React, { FunctionComponent, useMemo } from 'react';

import InstanceFileContent from '../../../instances/components/InstanceFileContent';

import {
    useGetInstance,
    useGetOrgUnitInstances,
} from '../../hooks/useGetInstances';

import { OrgUnit } from '../../../orgUnits/types/orgUnit';
import { HEIGHT } from '../../config';
import { RegistryParams } from '../../types';
import { EmptyInstances } from './EmptyInstances';
import { Filters } from './Filters';
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

    // selected instance should be:
    // submission id from params  OR reference instance OR first submission of the possible ones OR undefined
    // if undefined select should be hidden and a place holder should say no submission

    const currentInstanceId = useMemo(() => {
        return params.submissionId || orgUnit?.reference_instances?.[0]?.id;
    }, [params.submissionId, orgUnit]);

    const { data: currentInstance, isFetching: isFetchingCurrentInstance } =
        useGetInstance(currentInstanceId);
    const { data: instances, isFetching } = useGetOrgUnitInstances(orgUnit?.id);

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
                    <Filters
                        orgUnit={orgUnit}
                        params={params}
                        instances={instances}
                        isFetching={isFetching}
                    />
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
