import React, { useMemo } from 'react';
import { Tooltip, Box } from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';

import {
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import { Column } from '../../../types/table';
import { IntlFormatMessage } from '../../../types/intl';
import { DropdownTeamsOptions } from '../types/team';

import { AlreadyAssigned } from '../components/AlreadyAssigned';
import { LinkToOrgUnit } from '../components/LinkToOrgUnit';

import MESSAGES from '../messages';

type Props = {
    teams: DropdownTeamsOptions[];
};
export const useColumns = ({ teams }: Props): Column[] => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: 'ID',
                id: 'id',
                accessor: 'id',
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.name),
                id: 'name',
                accessor: 'name',
                sortable: false,
                Cell: settings => {
                    return <LinkToOrgUnit orgUnit={settings.row.original} />;
                },
            },
            {
                Header: formatMessage(MESSAGES.status),
                id: 'status',
                accessor: 'status',
                sortable: false,
                Cell: settings => {
                    const { otherAssignation } = settings.row.original;
                    return (
                        <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            {otherAssignation?.assignedTeam ||
                            otherAssignation?.assignedUser ? (
                                <Tooltip
                                    title={
                                        <AlreadyAssigned
                                            item={settings.row.original}
                                            teams={teams}
                                        />
                                    }
                                >
                                    <CancelIcon color="error" />
                                </Tooltip>
                            ) : (
                                <CheckCircleIcon color="primary" />
                            )}
                        </Box>
                    );
                },
            },
        ];
    }, [formatMessage, teams]);
};
