import { Box, Chip } from '@mui/material';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import React, { useMemo } from 'react';
import { computeEditableFields } from '../hooks/api/useRetrieveOrgUnitChangeRequestConfig';
import MESSAGES from '../messages';
import { OrgUnitChangeRequestConfigurationFull } from '../types';

export const EditableFieldsCell = ({
    row: { original },
}: {
    row: { original: OrgUnitChangeRequestConfigurationFull };
}) => {
    const { formatMessage } = useSafeIntl();
    const editableFields = useMemo(
        () => computeEditableFields(original),
        [original],
    );

    if (editableFields.length === 0) {
        return textPlaceholder;
    }

    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {editableFields.map(field => (
                <Chip
                    key={field}
                    color="primary"
                    label={
                        MESSAGES[field] ? formatMessage(MESSAGES[field]) : field
                    }
                    size="small"
                />
            ))}
        </Box>
    );
};
