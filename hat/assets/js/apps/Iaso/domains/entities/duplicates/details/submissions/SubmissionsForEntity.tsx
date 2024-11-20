import React, { FunctionComponent } from 'react';
import { ExpandableItem } from 'bluesquare-components';
import { Divider } from '@mui/material';
import { InstanceDetailRaw } from '../../../../instances/compare/components/InstanceDetailRaw';
import { useGetInstancesForEntity } from '../hooks/useGetInstancesForEntity';
import WidgetPaperComponent from '../../../../../components/papers/WidgetPaperComponent';
import { NoSubmission } from './NoSubmission';
import ExpandableLabel from './ExpandableLabel';

type Props = {
    entityId?: string;
    title: string;
};

export const SubmissionsForEntity: FunctionComponent<Props> = ({
    entityId,
    title = 'Entity',
}) => {
    const {
        data = { instances: [] },
        isLoading,
        isError,
    } = useGetInstancesForEntity({ entityId });

    return (
        <WidgetPaperComponent title={title} padded>
            {data.instances.length === 0 && <NoSubmission />}
            {data.instances.length > 0 &&
                data.instances.map((instance, index) => {
                    return (
                        <div key={instance.id}>
                            {index === 0 && (
                                <Divider
                                    style={{ height: '1px', width: '100%' }}
                                />
                            )}

                            <ExpandableItem
                                // This warning message on label should be fixed in bluesquare-components
                                label={<ExpandableLabel instance={instance} />}
                                titleColor="primary"
                                titleVariant="h5"
                            >
                                <InstanceDetailRaw
                                    isLoading={isLoading}
                                    isError={isError}
                                    data={instance}
                                    showTitle={false}
                                />
                            </ExpandableItem>
                            <Divider style={{ height: '1px', width: '100%' }} />
                        </div>
                    );
                })}
        </WidgetPaperComponent>
    );
};
