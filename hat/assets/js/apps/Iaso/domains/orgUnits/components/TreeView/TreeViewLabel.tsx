import React, { FunctionComponent } from 'react';
import { OrgUnit } from '../../types/orgUnit';
import { OrgUnitStatusIcon } from './OrgUnitStatusIcon';

type Props = {
    orgUnit: OrgUnit;
    withStatusIcon?: boolean;
    withType?: boolean;
};
export const TreeViewLabel: FunctionComponent<Props> = ({
    orgUnit,
    withStatusIcon = true,
    withType = false,
}) => {
    return (
        <>
            {orgUnit.name || `id: ${orgUnit.id}`}
            {withType && orgUnit.org_unit_type_short_name
                ? ` (${orgUnit.org_unit_type_short_name})`
                : ''}
            {withStatusIcon && <OrgUnitStatusIcon orgUnit={orgUnit} />}
        </>
    );
};
