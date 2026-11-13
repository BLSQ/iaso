import React, { FunctionComponent } from 'react';
import { Link } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { Submission, SubmissionRow } from '../../types';
import { formatDateTime } from '../../utils';
import { SubmissionRowsTable } from './SubmissionRowsTable';
import { joinDot, submissionUrl } from './utils';

// A collapsible submission linked to the entity, with all its fields
export const LinkedSubmission: FunctionComponent<{
    submission: Submission & { rows: SubmissionRow[] };
}> = ({ submission }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <details>
            <summary>
                {joinDot([
                    formatDateTime(
                        submission.source_created_at ?? submission.created_at,
                    ),
                    `${submission.form_name ?? ''} (${submission.form_id ?? ''})`,
                    submission.org_unit_name,
                    `#${submission.id}`,
                ])}
                {submission.deleted && (
                    <strong> {formatMessage(MESSAGES.deletedTag)}</strong>
                )}
            </summary>
            <p>
                {joinDot([
                    formatMessage(MESSAGES.syncedDate, {
                        date: formatDateTime(submission.created_at),
                    }),
                    formatMessage(MESSAGES.updatedDate, {
                        date: formatDateTime(submission.updated_at),
                    }),
                    <Link
                        key="open"
                        href={submissionUrl(submission.id)}
                        target="_blank"
                    >
                        {formatMessage(MESSAGES.openSubmission)}
                    </Link>,
                ])}
            </p>
            <SubmissionRowsTable rows={submission.rows} />
        </details>
    );
};
