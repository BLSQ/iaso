import React, { useMemo } from 'react';
import { Box, Chip } from '@mui/material';
import { Column, useSafeIntl } from 'bluesquare-components';
import { DateCell } from 'Iaso/components/Cells/DateTimeCell';
import { Actions, ActionsProps } from './components/Actions';
import MESSAGES from './messages';

export const useColumns = (
    accountId: string | undefined,
    onShowData: (entityId: number) => void,
): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.entityId),
                id: 'entity_id',
                accessor: 'entity_id',
            },
            {
                Header: formatMessage(MESSAGES.uuid),
                id: 'uuid',
                accessor: 'uuid',
                sortable: false,
                Cell: ({ value }) => (
                    <Box
                        component="span"
                        title={value}
                        sx={{
                            display: 'inline-block',
                            maxWidth: 140,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            verticalAlign: 'middle',
                        }}
                    >
                        {value}
                    </Box>
                ),
            },
            {
                Header: formatMessage(MESSAGES.entityType),
                id: 'entity_type_name',
                accessor: 'entity_type_name',
                sortable: false,
                Cell: ({ value }) => (
                    <Chip size="small" color="primary" label={value} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.gender),
                id: 'gender',
                accessor: 'gender',
                Cell: ({ value }) => value ?? '--',
            },
            {
                Header: formatMessage(MESSAGES.birthDate),
                id: 'birth_date',
                accessor: 'birth_date',
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.journeys),
                id: 'journeys_count',
                accessor: 'journeys_count',
            },
            {
                Header: formatMessage(MESSAGES.visits),
                id: 'visits_count',
                accessor: 'visits_count',
            },
            {
                Header: formatMessage(MESSAGES.lastVisit),
                id: 'last_visit_date',
                accessor: 'last_visit_date',
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                id: 'expander',
                accessor: 'expander',
                expander: true,
                width: 160,
                Expander: (
                    props: Omit<ActionsProps, 'accountId' | 'onShowData'>,
                ) => (
                    <Actions
                        {...props}
                        accountId={accountId}
                        onShowData={onShowData}
                    />
                ),
            },
        ],
        [formatMessage, accountId, onShowData],
    );
};
