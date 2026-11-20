import React, { FC } from 'react';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { useSafeIntl } from 'bluesquare-components';
import { useAssignmentsParams } from '../../../hooks/useAssignmentsParams';
import MESSAGES from '../../../messages';
import { FilterToggle } from './FilterToggle';

export const OnlyAssignableToggle: FC = () => {
    const { formatMessage } = useSafeIntl();
    const { onlyAssignable, toggleOnlyAssignable } = useAssignmentsParams();
    return (
        <FilterToggle
            isOn={onlyAssignable}
            onToggle={toggleOnlyAssignable}
            label={formatMessage(
                onlyAssignable
                    ? MESSAGES.showAllOrgUnits
                    : MESSAGES.showOnlyAssignableOrgUnits,
            )}
            icon={<PlaylistAddCheckIcon fontSize="small" />}
        />
    );
};
