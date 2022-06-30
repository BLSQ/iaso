import { useMemo } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { OrgUnitShape, OrgUnitMarker } from '../types/locations';
import { Column } from '../../../types/table';

import MESSAGES from '../messages';

type Props = {
    orgUnits: Array<OrgUnitShape | OrgUnitMarker>;
};

const getParentCount = (
    orgUnit: OrgUnitShape | OrgUnitMarker | OrgUnit,
    count = 0,
): number => {
    let newCount = count;
    if (orgUnit.parent) {
        newCount += 1 + getParentCount(orgUnit.parent, newCount);
    }
    return newCount;
};

export const useColumns = ({ orgUnits }: Props): Column[] => {
    const { formatMessage } = useSafeIntl();

    return useMemo(() => {
        const columns: Column[] = [
            {
                Header: formatMessage(MESSAGES.orgUnits),
                id: 'name',
                accessor: 'name',
                align: 'left',
            },
            // @ts-ignore
        ];
        const firstOrgunit: OrgUnitShape | OrgUnitMarker | OrgUnit =
            orgUnits[0];
        const parentCount: number = firstOrgunit
            ? getParentCount(firstOrgunit)
            : 0;
        Array(parentCount)
            .fill(null)
            .forEach((_, index) => {
                columns.push({
                    Header: formatMessage(MESSAGES.orgUnitsParent, {
                        index: index + 1,
                    }),
                    id: `parent.${'parent.'.repeat(index)}name`,
                    accessor: `parent.${'parent.'.repeat(index)}name`,
                    align: 'center',
                });
            });
        return columns;
    }, [formatMessage, orgUnits]);
};
