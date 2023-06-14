import React, { FunctionComponent } from 'react';
import { useSafeIntl, ExpandableItem } from 'bluesquare-components';
import { Divider } from '@material-ui/core';
import { InstanceDetailRaw } from '../../../../instances/compare/components/InstanceDetailRaw';
import { useGetInstancesForEntity } from '../hooks/useGetInstancesForEntity';
import MESSAGES from '../../messages';
import WidgetPaperComponent from '../../../../../components/papers/WidgetPaperComponent';
import { NoSubmission } from './NoSubmission';

type Props = {
    entityId?: string;
    title: string;
};

export const SubmissionsForEntity: FunctionComponent<Props> = ({
    entityId,
    title = 'Entity',
}) => {
    const { formatMessage } = useSafeIntl();
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
                                label={`${formatMessage(
                                    MESSAGES.submissionTitle,
                                )} - ${instance.id}`}
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
