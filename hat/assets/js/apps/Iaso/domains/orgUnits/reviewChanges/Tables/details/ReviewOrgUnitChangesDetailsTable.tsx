/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { LoadingSpinner } from 'bluesquare-components';
import { TableContainer, Table } from '@mui/material';
import { useGetApprovalProposal } from '../../hooks/api/useGetApprovalProposal';
import { SelectedChangeRequest } from '../ReviewOrgUnitChangesTable';
import { NewOrgUnitField } from '../../hooks/useNewFields';
import { ReviewOrgUnitChangesDetailsTableHead } from './ReviewOrgUnitChangesDetailsTableHead';
import { ReviewOrgUnitChangesDetailsTableBody } from './ReviewOrgUnitChangesDetailsTableBody';

type Props = {
    isSaving: boolean;
    selectedChangeRequest?: SelectedChangeRequest;
    newFields: NewOrgUnitField[];
    // eslint-disable-next-line no-unused-vars
    setSelected: (key: string) => void;
};

export const ReviewOrgUnitChangesDetailsTable: FunctionComponent<Props> = ({
    isSaving,
    selectedChangeRequest,
    newFields,
    setSelected,
}) => {
    const { data: changeRequest, isFetching: isFetchingChangeRequest } =
        useGetApprovalProposal(selectedChangeRequest?.id);
    const isNew: boolean =
        !isFetchingChangeRequest && changeRequest?.status === 'new';

    return (
        <TableContainer sx={{ maxHeight: '80vh', minHeight: 200 }}>
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
