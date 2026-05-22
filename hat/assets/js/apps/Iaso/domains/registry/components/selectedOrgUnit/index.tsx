import React, { FunctionComponent, useMemo } from 'react';
import { Box, Divider, Paper } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { LoadingSpinner, commonStyles } from 'bluesquare-components';

import InstanceFileContent from '../../../instances/components/InstanceFileContent';

import { OrgUnit } from '../../../orgUnits/types/orgUnit';
import { HEIGHT } from '../../config';
import {
    useGetInstance,
    useGetOrgUnitInstances,
} from '../../hooks/useGetInstances';

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
        overflow: 'hidden',
    },
    formContents: {
        maxHeight: `calc(${HEIGHT} - 155px)`,
        overflow: 'auto',
    },
}));

export const SelectedOrgUnit: FunctionComponent<Props> = ({
    orgUnit,
    params,
    isFetching: isFetchingOrgUnit,
}) => {
    const classes: Record<string, string> = useStyles();

    const { data: instances, isFetching } = useGetOrgUnitInstances(orgUnit?.id);
    const currentInstanceId = useMemo(() => {
        return (
            params.submissionId ||
            orgUnit?.reference_instances?.[0]?.id ||
            instances?.[0]?.id
        );
    }, [params.submissionId, orgUnit, instances]);

    const { data: currentInstance, isFetching: isFetchingCurrentInstance } =
        useGetInstance(currentInstanceId, false);

    if (!orgUnit) {
        return null;
    }
    return (
        <Box position="relative" width="100%" minHeight={HEIGHT}>
            {(isFetchingCurrentInstance || isFetchingOrgUnit) &&
                params.fullScreen !== 'true' && <LoadingSpinner absolute />}

            <Paper className={classes.paper}>
                <OrgUnitTitle orgUnit={orgUnit} params={params} />
                <Divider />
                {instances && instances?.length === 0 && <EmptyInstances />}
                {instances && instances?.length > 0 && (
                    <InstanceTitle
                        currentInstance={currentInstance}
                        orgUnit={orgUnit}
                        params={params}
                        instances={instances}
                        isFetching={isFetching}
                    />
                )}
                {currentInstance && (
                    <>
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
