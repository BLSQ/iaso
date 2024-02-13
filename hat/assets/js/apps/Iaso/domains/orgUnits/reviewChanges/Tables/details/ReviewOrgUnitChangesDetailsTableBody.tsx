/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { TableBody } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { NewOrgUnitField } from '../../hooks/useNewFields';
import { ReviewOrgUnitChangesDetailsTableRow } from './ReviewOrgUnitChangesDetailsTableRow';
import { OrgUnitChangeRequestDetails } from '../../types';
import { ReviewOrgUnitChangeDetailsPlaceholderRow } from './ReviewOrgUnitChangeDetailsPlaceholderRow';
import MESSAGES from '../../../messages';

type Props = {
    newFields: NewOrgUnitField[];
    // eslint-disable-next-line no-unused-vars
    setSelected: (key: string) => void;
    isFetchingChangeRequest: boolean;
    changeRequest?: OrgUnitChangeRequestDetails;
    isNew: boolean;
    isNewOrgUnit: boolean;
    hasName: boolean;
    hasType: boolean;
};

export const ReviewOrgUnitChangesDetailsTableBody: FunctionComponent<Props> = ({
    newFields,
    setSelected,
    isFetchingChangeRequest,
    changeRequest,
    isNew,
    isNewOrgUnit,
    hasName,
    hasType,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <TableBody>
            {isNewOrgUnit && !hasName && (
                <ReviewOrgUnitChangeDetailsPlaceholderRow
                    fieldKey="name"
                    value={formatMessage(MESSAGES.name)}
                />
            )}
            {isNewOrgUnit && !hasType && (
                <ReviewOrgUnitChangeDetailsPlaceholderRow
                    fieldKey="org_unit_type"
                    value={formatMessage(MESSAGES.org_unit_type)}
                />
            )}
            {newFields.map(field => (
                <ReviewOrgUnitChangesDetailsTableRow
                    key={field.key}
                    field={field}
                    setSelected={setSelected}
                    isNew={isNew}
                    isNewOrgUnit={isNewOrgUnit}
                    changeRequest={changeRequest}
                    isFetchingChangeRequest={isFetchingChangeRequest}
                />
            ))}
        </TableBody>
    );
};
