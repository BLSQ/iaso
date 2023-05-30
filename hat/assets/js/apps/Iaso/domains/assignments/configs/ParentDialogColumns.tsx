import React, { useMemo } from 'react';

import { useSafeIntl, Column } from 'bluesquare-components';

import { IntlFormatMessage } from '../../../types/intl';
import { SubTeam, User } from '../types/team';

import { LinkToOrgUnit } from '../../orgUnits/components/LinkToOrgUnit';
import { CheckBoxCell } from '../components/CheckBoxCell';

import MESSAGES from '../messages';

type Props = {
    orgUnitsToUpdate: Array<number>;
    // eslint-disable-next-line no-unused-vars
    setOrgUnitsToUpdate: (ids: Array<number>) => void;
    selectedItem: SubTeam | User | undefined;
    mode: 'UNASSIGN' | 'ASSIGN';
};

export const useColumns = ({
    orgUnitsToUpdate,
    setOrgUnitsToUpdate,
    selectedItem,
    mode,
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
                    return (
                        <CheckBoxCell
                            orgUnit={settings.row.original}
                            orgUnitsToUpdate={orgUnitsToUpdate}
                            mode={mode}
                            selectedItem={selectedItem}
                            setOrgUnitsToUpdate={setOrgUnitsToUpdate}
                        />
                    );
                },
            },
        ];
    }, [
        formatMessage,
        orgUnitsToUpdate,
        setOrgUnitsToUpdate,
        mode,
        selectedItem,
    ]);
};
