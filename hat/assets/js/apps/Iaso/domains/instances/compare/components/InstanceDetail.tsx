import { TypographyVariant } from '@mui/material';
import React, { FunctionComponent } from 'react';
import { Instance } from '../../types/instance';
import { useGetInstance } from '../hooks/useGetInstance';
import { InstanceDetailRaw } from './InstanceDetailRaw';

type Props = {
    instanceId: string | undefined;
    showTitle?: boolean;
    height?: string | number;
    titleVariant?: TypographyVariant;
    titleColor?: string;
};

const InstanceDetail: FunctionComponent<Props> = ({
    instanceId,
    showTitle = true,
    height,
    titleVariant,
    titleColor,
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
            titleColor={titleColor}
        />
    );
};

export default InstanceDetail;
