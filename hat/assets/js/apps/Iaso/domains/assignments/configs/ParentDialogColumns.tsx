import React, { useMemo } from 'react';
import { Tooltip, Box, Checkbox } from '@material-ui/core';

import {
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import { Column } from '../../../types/table';
import { IntlFormatMessage } from '../../../types/intl';

import { LinkToOrgUnit } from '../components/LinkToOrgUnit';
import MESSAGES from '../messages';

type Props = {
    orgUnitsToUpdate: Array<number>;
    // eslint-disable-next-line no-unused-vars
    setOrgUnitsToUpdate: (ids: Array<number>) => void;
};

export const useColumns = ({
    orgUnitsToUpdate,
    setOrgUnitsToUpdate,
}: Props): Column[] => {
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
                Header: formatMessage(MESSAGES.assignment),
                id: 'assignment',
                accessor: 'assignment',
                sortable: false,
                Cell: settings => {
                    const orgUnitId = settings.row.original.id;
                    const disabled = !orgUnitsToUpdate.includes(orgUnitId);
                    return (
                        <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            {!disabled && (
                                <Checkbox
                                    size="small"
                                    color="primary"
                                    checked
                                    onChange={() => {
                                        const orgUnits =
                                            orgUnitsToUpdate.filter(
                                                orgunitId =>
                                                    orgunitId !== orgUnitId,
                                            );
                                        console.log('orgUnits', orgUnits);
                                        setOrgUnitsToUpdate(orgUnits);
                                    }}
                                />
                            )}
                            {disabled && (
                                <Tooltip
                                    arrow
                                    placement="top"
                                    title={formatMessage(
                                        MESSAGES.alreadyAssigned,
                                    )}
                                >
                                    <Box>
                                        <Checkbox
                                            size="small"
                                            color="primary"
                                            checked
                                            disabled
                                        />
                                    </Box>
                                </Tooltip>
                            )}
                        </Box>
                    );
                },
            },
        ];
    }, [formatMessage, orgUnitsToUpdate, setOrgUnitsToUpdate]);
};
