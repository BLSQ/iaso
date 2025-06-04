import { Table, TableContainer } from '@mui/material';
import { LoadingSpinner } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { NewOrgUnitField } from '../../hooks/useNewFields';
import { OrgUnitChangeRequestDetails } from '../../types';
import { ReviewOrgUnitChangesDetailsTableBody } from './ReviewOrgUnitChangesDetailsTableBody';
import { ReviewOrgUnitChangesDetailsTableHead } from './ReviewOrgUnitChangesDetailsTableHead';

type Props = {
    isSaving: boolean;
    newFields: NewOrgUnitField[];
    setSelected: (key: string) => void;
    changeRequest?: OrgUnitChangeRequestDetails;
    isFetchingChangeRequest: boolean;
    isNewOrgUnit: boolean;
};

export const ReviewOrgUnitChangesDetailsTable: FunctionComponent<Props> = ({
    isSaving,
    newFields,
    setSelected,
    changeRequest,
    isFetchingChangeRequest,
    isNewOrgUnit,
}) => {
    const isNew: boolean =
        !isFetchingChangeRequest && changeRequest?.status === 'new';
    return (
        <TableContainer>
            {(isFetchingChangeRequest || isSaving) && (
                <LoadingSpinner absolute />
            )}
            <Table size="small" stickyHeader>
                <ReviewOrgUnitChangesDetailsTableHead
                    isNew={isNew}
                    isNewOrgUnit={isNewOrgUnit}
                />
                <ReviewOrgUnitChangesDetailsTableBody
                    isFetchingChangeRequest={isFetchingChangeRequest}
                    changeRequest={changeRequest}
                    newFields={newFields}
                    setSelected={setSelected}
                    isNew={isNew}
                    isNewOrgUnit={isNewOrgUnit}
                />
            </Table>
        </TableContainer>
    );
};
