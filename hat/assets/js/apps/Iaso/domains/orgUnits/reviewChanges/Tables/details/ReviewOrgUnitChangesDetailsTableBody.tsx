import React, { FunctionComponent } from 'react';
import { TableBody } from '@mui/material';
import { NewOrgUnitField } from '../../hooks/useNewFields';
import { ReviewOrgUnitChangesDetailsTableRow } from './ReviewOrgUnitChangesDetailsTableRow';
import { OrgUnitChangeRequestDetails } from '../../types';

type Props = {
    newFields: NewOrgUnitField[];
    // eslint-disable-next-line no-unused-vars
    setSelected: (key: string) => void;
    isFetchingChangeRequest: boolean;
    changeRequest?: OrgUnitChangeRequestDetails;
    isNew: boolean;
    isNewOrgUnit: boolean;
};

export const ReviewOrgUnitChangesDetailsTableBody: FunctionComponent<Props> = ({
    newFields,
    setSelected,
    isFetchingChangeRequest,
    changeRequest,
    isNew,
    isNewOrgUnit,
}) => {
    return (
        <TableBody>
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
