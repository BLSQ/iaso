import React, { FunctionComponent } from 'react';
import { Box, Tooltip, Checkbox } from '@material-ui/core';
import { useSafeIntl, IntlFormatMessage } from 'bluesquare-components';
import MESSAGES from '../messages';
import { ChildrenOrgUnitsArrayItem } from '../types/orgUnit';
import { SubTeam, User } from '../types/team';

type Props = {
    orgUnit: ChildrenOrgUnitsArrayItem;
    orgUnitsToUpdate: Array<number>;
    mode: 'UNASSIGN' | 'ASSIGN';
    selectedItem: SubTeam | User | undefined;
    // eslint-disable-next-line no-unused-vars
    setOrgUnitsToUpdate: (orgUnitsToUpdate: Array<number>) => void;
};

export const CheckBoxCell: FunctionComponent<Props> = ({
    orgUnit,
    orgUnitsToUpdate,
    mode,
    selectedItem,
    setOrgUnitsToUpdate,
}) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const { id: orgUnitId, assignment } = orgUnit;
    const checked = orgUnitsToUpdate.includes(orgUnitId);
    const disabled =
        mode === 'ASSIGN' &&
        assignment?.org_unit === orgUnitId &&
        (assignment?.team === selectedItem?.id ||
            assignment?.user === selectedItem?.id);

    const handleChange = () => {
        let orgUnits = [...orgUnitsToUpdate];
        if (checked) {
            orgUnits = orgUnits.filter(orgunitId => orgunitId !== orgUnitId);
        } else {
            orgUnits.push(orgUnitId);
        }
        setOrgUnitsToUpdate(orgUnits);
    };
    return (
        <Box display="flex" alignItems="center" justifyContent="center">
            {!disabled && (
                <Checkbox
                    size="small"
                    color="primary"
                    checked={checked}
                    onChange={handleChange}
                />
            )}
            {disabled && (
                <Tooltip
                    arrow
                    placement="top"
                    title={formatMessage(MESSAGES.alreadyAssigned)}
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
};
