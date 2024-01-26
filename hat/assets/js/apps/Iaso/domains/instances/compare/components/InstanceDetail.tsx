import React, { FunctionComponent } from 'react';
import { TypographyVariant } from '@mui/material';
import { useGetInstance } from '../hooks/useGetInstance';
import { Instance } from '../../types/instance';
import { InstanceDetailRaw } from './InstanceDetailRaw';

type Props = {
    instanceId: string | undefined;
    showTitle?: boolean;
    height?: string | number;
    titleVariant?: TypographyVariant;
};

const InstanceDetail: FunctionComponent<Props> = ({
    instanceId,
    showTitle = true,
    height,
    titleVariant,
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
            height={height}
            titleVariant={titleVariant}
        />
    );
};

export default InstanceDetail;
