import { Box } from '@mui/material';
import moment from 'moment';
import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { baseUrls } from '../../../../constants/urls';
import MESSAGES from '../../messages';

import { redirectToReplace } from '../../../../routing/actions';

import InputComponent from '../../../../components/forms/InputComponent';

import { Instance } from '../../../instances/types/instance';
import { OrgUnit } from '../../../orgUnits/types/orgUnit';
import { RegistryParams } from '../../types';

type Props = {
    orgUnit?: OrgUnit;
    params: RegistryParams;
    instances: Instance[];
    isFetching: boolean;
};

export const Filters: FunctionComponent<Props> = ({
    orgUnit,
    params,
    instances,
    isFetching,
}) => {
    const dispatch = useDispatch();

    const currentInstanceId = useMemo(() => {
        return params.submissionId || orgUnit?.reference_instances?.[0]?.id;
    }, [params.submissionId, orgUnit]);

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

    return (
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
                    disabled={isFetching || instancesOptions.length <= 1}
                    keyValue="instance"
                    onChange={handleChange}
                    value={isFetching ? undefined : currentInstanceId}
                    label={MESSAGES.submission}
                    options={instancesOptions}
                    loading={isFetching}
                    clearable={false}
                />
            </Box>
        </Box>
    );
};
