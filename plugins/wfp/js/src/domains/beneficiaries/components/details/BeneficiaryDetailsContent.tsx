import React, { FunctionComponent, ReactNode } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { BeneficiaryDetails } from '../../types';
import { formatDate, formatDateTime } from '../../utils';
import { KeyValueTable } from './KeyValueTable';
import { LinkedSubmission } from './LinkedSubmission';
import { SubmissionRowsTable } from './SubmissionRowsTable';

// The entity, its ETL beneficiary, its reference form and every submission linked to it
export const BeneficiaryDetailsContent: FunctionComponent<{
    details: BeneficiaryDetails;
}> = ({ details: { entity, beneficiary, attributes, submissions } }) => {
    const { formatMessage } = useSafeIntl();
    const entityRows: { key: string; value: ReactNode }[] = [
        { key: formatMessage(MESSAGES.uuid), value: entity.uuid },
        {
            key: formatMessage(MESSAGES.created),
            value: formatDateTime(entity.created_at),
        },
    ];
    if (entity.deleted_at) {
        entityRows.push({
            key: formatMessage(MESSAGES.deleted),
            value: formatDateTime(entity.deleted_at),
        });
    }
    if (beneficiary) {
        entityRows.push(
            {
                key: formatMessage(MESSAGES.etlGender),
                value: beneficiary.gender ?? '',
            },
            {
                key: formatMessage(MESSAGES.etlBirthDate),
                value: formatDate(beneficiary.birth_date),
            },
            {
                key: formatMessage(MESSAGES.etlGuidelines),
                value: beneficiary.guidelines ?? '',
            },
        );
    }
    return (
        <>
            <h3>
                {formatMessage(MESSAGES.entityTitle, {
                    id: String(entity.id),
                    entityType: entity.entity_type_name ?? '',
                })}
            </h3>
            <KeyValueTable rows={entityRows} />

            <h3>
                {entity.reference_submission_id
                    ? formatMessage(MESSAGES.referenceFormSubmission, {
                          id: String(entity.reference_submission_id),
                      })
                    : formatMessage(MESSAGES.referenceForm)}
            </h3>
            {attributes.length > 0 ? (
                <SubmissionRowsTable rows={attributes} />
            ) : (
                <p className="muted">
                    {formatMessage(MESSAGES.noReferenceData)}
                </p>
            )}

            <h3>
                {formatMessage(MESSAGES.linkedSubmissions, {
                    count: String(submissions.length),
                })}
            </h3>
            {submissions.map(submission => (
                <LinkedSubmission key={submission.id} submission={submission} />
            ))}
            {submissions.length === 0 && (
                <p className="muted">{formatMessage(MESSAGES.noSubmissions)}</p>
            )}
        </>
    );
};
