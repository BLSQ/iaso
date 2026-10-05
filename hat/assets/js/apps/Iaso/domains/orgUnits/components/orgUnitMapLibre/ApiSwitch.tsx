import React, { FunctionComponent } from 'react';
import { Paper, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { IntlMessage, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';

export type OrgUnitsApi = 'v1' | 'v3' | 'mvt';

const OPTIONS: { value: OrgUnitsApi; label: string; help: IntlMessage }[] = [
    { value: 'v1', label: 'v1', help: MESSAGES.mapLibreApiV1 },
    { value: 'v3', label: 'v3', help: MESSAGES.mapLibreApiV3 },
    { value: 'mvt', label: 'MVT', help: MESSAGES.mapLibreApiMvt },
];

type Props = {
    value: OrgUnitsApi;
    onChange: (api: OrgUnitsApi) => void;
};

/** Which API the map draws the org units from */
export const ApiSwitch: FunctionComponent<Props> = ({ value, onChange }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Paper
            elevation={2}
            sx={{
                position: 'absolute',
                top: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 500,
            }}
        >
            <ToggleButtonGroup
                exclusive
                size="small"
                value={value}
                onChange={(_, api: OrgUnitsApi | null) => api && onChange(api)}
            >
                {OPTIONS.map(({ value: api, label, help }) => (
                    <Tooltip key={api} title={formatMessage(help)}>
                        <ToggleButton value={api} sx={{ px: 2 }}>
                            {label}
                        </ToggleButton>
                    </Tooltip>
                ))}
            </ToggleButtonGroup>
        </Paper>
    );
};
