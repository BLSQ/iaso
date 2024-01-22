import React, { FunctionComponent } from 'react';
import { TypographyVariant } from '@mui/material';
import { useGetInstance } from '../hooks/useGetInstance';
import { Instance } from '../../types/instance';
import { InstanceDetailRaw } from './InstanceDetailRaw';

type Props = {
    instanceId: string | undefined;
    showTitle?: boolean;
    minHeight?: string | number;
    titleVariant?: TypographyVariant;
};

const InstanceDetail: FunctionComponent<Props> = ({
    instanceId,
    showTitle = true,
    minHeight,
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
            minHeight={minHeight}
            titleVariant={titleVariant}
        />
    );
};

export default InstanceDetail;
