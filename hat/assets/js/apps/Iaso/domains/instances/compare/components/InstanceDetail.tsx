import React, { FunctionComponent } from 'react';
import { useGetInstance } from '../hooks/useGetInstance';
import { Instance } from '../../types/instance';
import { InstanceDetailRaw } from './InstanceDetailRaw';

type Props = {
    instanceId: string | undefined;
    showTitle?: boolean;
};

const InstanceDetail: FunctionComponent<Props> = ({
    instanceId,
    showTitle = true,
}) => {
    const {
        data,
        isLoading,
        isError,
    }: { data?: Instance; isLoading: boolean; isError: boolean } =
        useGetInstance(instanceId);

    return (
        <InstanceDetailRaw
            data={data}
            isLoading={isLoading}
            isError={isError}
            showTitle={showTitle}
        />
    );
};

export default InstanceDetail;
