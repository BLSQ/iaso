import React, { FC } from 'react';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { useSafeIntl } from 'bluesquare-components';
import { useAssignmentsParams } from '../../../hooks/useAssignmentsParams';
import MESSAGES from '../../../messages';
import { FilterToggle } from './FilterToggle';

export const OnlyUnassignedToggle: FC = () => {
    const { formatMessage } = useSafeIntl();
    const { onlyUnassigned, toggleOnlyUnassigned } = useAssignmentsParams();
    return (
        <FilterToggle
            isOn={onlyUnassigned}
            onToggle={toggleOnlyUnassigned}
            label={formatMessage(
                onlyUnassigned
                    ? MESSAGES.showAllOrgUnits
                    : MESSAGES.showOnlyUnassignedOrgUnits,
            )}
            icon={<FilterAltIcon fontSize="small" />}
        />
    );
};
