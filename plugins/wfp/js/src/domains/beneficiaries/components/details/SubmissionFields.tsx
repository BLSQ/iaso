import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { useGetSubmissionFields } from '../../requests';
import { formatDateTime } from '../../utils';
import { QueryResultView } from './QueryResultView';
import { SubmissionRowsTable } from './SubmissionRowsTable';
import { joinDot } from './utils';

// Header and fields of a submission, shown when hovering its link
export const SubmissionFields: FunctionComponent<{
    instanceId: number;
}> = ({ instanceId }) => {
    const { formatMessage } = useSafeIntl();
    const query = useGetSubmissionFields(instanceId);
    return (
        <QueryResultView
            query={query}
            errorMessage={formatMessage(MESSAGES.couldNotLoadSubmission)}
        >
            {({ submission, rows }) => (
                <>
                    <div className="submission-header">
                        <strong>{submission.form_name}</strong> (
                        {submission.form_id}) · #{submission.id}
                        {submission.deleted && (
                            <strong>
                                {' '}
                                {formatMessage(MESSAGES.deletedTag)}
                            </strong>
                        )}
                        <br />
                        {joinDot([
                            submission.org_unit_name ?? '',
                            formatMessage(MESSAGES.deviceDate, {
                                date: formatDateTime(
                                    submission.source_created_at,
                                ),
                            }),
                            formatMessage(MESSAGES.syncedDate, {
                                date: formatDateTime(submission.created_at),
                            }),
                        ])}
                    </div>
                    <SubmissionRowsTable
                        rows={rows}
                        emptyMessage={formatMessage(MESSAGES.noFields)}
                    />
                </>
            )}
        </QueryResultView>
    );
};
