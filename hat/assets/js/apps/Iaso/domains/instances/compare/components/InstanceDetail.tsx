import React, { FunctionComponent } from 'react';
import { useGetInstance } from '../hooks/useGetInstance';
import { Instance } from '../../types/instance';
import { InstanceDetailRaw } from './InstanceDetailRaw';

type Props = {
    instanceId: string | undefined;
    showTitle?: boolean;
    displayLinktoInstance?: boolean;
    minHeight?: string | number;
};

const InstanceDetail: FunctionComponent<Props> = ({
    instanceId,
    showTitle = true,
    displayLinktoInstance = false,
    minHeight,
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
            displayLinktoInstance={displayLinktoInstance}
            minHeight={minHeight}
        />
    );
};

export default InstanceDetail;
