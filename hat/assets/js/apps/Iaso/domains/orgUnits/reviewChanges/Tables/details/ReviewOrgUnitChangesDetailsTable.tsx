/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { LoadingSpinner } from 'bluesquare-components';
import { TableContainer, Table } from '@mui/material';
import { NewOrgUnitField } from '../../hooks/useNewFields';
import { ReviewOrgUnitChangesDetailsTableHead } from './ReviewOrgUnitChangesDetailsTableHead';
import { ReviewOrgUnitChangesDetailsTableBody } from './ReviewOrgUnitChangesDetailsTableBody';
import { OrgUnitChangeRequestDetails } from '../../types';

type Props = {
    isSaving: boolean;
    newFields: NewOrgUnitField[];
    // eslint-disable-next-line no-unused-vars
    setSelected: (key: string) => void;
    changeRequest?: OrgUnitChangeRequestDetails;
    isFetchingChangeRequest: boolean;
};

export const ReviewOrgUnitChangesDetailsTable: FunctionComponent<Props> = ({
    isSaving,
    newFields,
    setSelected,
    changeRequest,
    isFetchingChangeRequest,
}) => {
    const isNew: boolean =
        !isFetchingChangeRequest && changeRequest?.status === 'new';

    return (
        <TableContainer sx={{ maxHeight: '75vh', minHeight: 300, mb: -2 }}>
            {(isFetchingChangeRequest || isSaving) && (
                <LoadingSpinner absolute />
            )}
            <Table size="small" stickyHeader>
                <ReviewOrgUnitChangesDetailsTableHead isNew={isNew} />
                <ReviewOrgUnitChangesDetailsTableBody
                    isFetchingChangeRequest={isFetchingChangeRequest}
                    changeRequest={changeRequest}
                    newFields={newFields}
                    setSelected={setSelected}
                    isNew={isNew}
                />
            </Table>
        </TableContainer>
    );
};
