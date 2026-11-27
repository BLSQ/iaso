import React, { useMemo } from 'react';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import { ActionsCell, Column, useSafeIntl } from 'bluesquare-components';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import {
    OrgUnitCell,
    SubmissionCell,
    SubmittedByCell,
    ValidationCell,
} from './components/Cells';
import MESSAGES from './messages';
import { ValidationWorkflowInstanceListResponseItem } from './types';
import { getSubmissionUrl } from './utils';

type CellSettings = {
    row: { original: ValidationWorkflowInstanceListResponseItem };
};

export const useValidationWorkflowInstanceSearchColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const accountId = currentUser.account?.id;
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.submission),
                id: 'id',
                accessor: 'id',
                sortable: false,
                align: 'left',
                Cell: ({ row: { original } }: CellSettings) => (
                    <SubmissionCell item={original} accountId={accountId} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.orgUnit),
                id: 'org_unit__name',
                accessor: 'org_unit',
                sortable: false,
                align: 'left',
                Cell: ({ row: { original } }: CellSettings) => (
                    <OrgUnitCell item={original} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.submittedBy),
                id: 'submitted_by',
                accessor: 'submitted_by',
                sortable: false,
                align: 'left',
                Cell: ({ row: { original } }: CellSettings) => (
                    <SubmittedByCell item={original} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.title),
                // sorting on this column sorts on the waiting time
                id: 'pending_since',
                accessor: 'pending_since',
                sortable: true,
                align: 'left',
                Cell: ({ row: { original } }: CellSettings) => (
                    <ValidationCell item={original} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                resizable: false,
                sortable: false,
                Cell: ({ row: { original } }: CellSettings) => (
                    <ActionsCell
                        actions={[
                            {
                                key: 'review',
                                label: MESSAGES.review,
                                icon: <FactCheckIcon />,
                                href: getSubmissionUrl({
                                    item: original,
                                    accountId,
                                }),
                            },
                        ]}
                    />
                ),
            },
        ],
        [accountId, formatMessage],
    );
};
