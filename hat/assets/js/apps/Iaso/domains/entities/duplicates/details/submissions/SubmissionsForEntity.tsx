import React, { FunctionComponent } from 'react';
import { InstanceDetailRaw } from '../../../../instances/compare/components/InstanceDetailRaw';
import { useGetInstancesForEntity } from '../hooks/useGetInstancesForEntity';

type Props = {
    entityId?: string;
};

export const SubmissionsForEntity: FunctionComponent<Props> = ({
    entityId,
}) => {
    const {
        data = { instances: [] },
        isLoading,
        isError,
    } = useGetInstancesForEntity({ entityId });

    return (
        <>
            {data?.instances.map(instance => (
                <InstanceDetailRaw
                    isLoading={isLoading}
                    isError={isError}
                    data={instance}
                    key={instance.id}
                />
            ))}
        </>
    );
};
