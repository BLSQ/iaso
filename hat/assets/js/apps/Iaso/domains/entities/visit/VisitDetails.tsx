import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import InstanceFileContent from '../../instances/components/InstanceFileContent';
import { useGetVisitSubmission } from '../beneficiaries/hooks/requests';

type Props = {
    // instanceId: string;
    // beneficiaryId: string;
    params: { instanceId: string };
};

export const VisitDetails: FunctionComponent<Props> = ({
    // instanceId,
    // beneficiaryId,
    params,
}) => {
    const { instanceId, beneficiaryId } = params;
    console.log('BiD', beneficiaryId);
    const { formatMessage } = useSafeIntl();
    const { data: submission, isLoading } = useGetVisitSubmission(instanceId);
    return (
        <>
            {!isLoading && <InstanceFileContent instance={submission} />}
            {isLoading && <LoadingSpinner />}
        </>
    );
};
