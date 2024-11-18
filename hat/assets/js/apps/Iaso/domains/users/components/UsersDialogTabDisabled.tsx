import { Tab, Tooltip } from '@mui/material';
import React, { FunctionComponent } from 'react';

type Props = {
    label: string;
    disabled: boolean;
    tooltipMessage: string;
};
const UsersDialogTabDisabled: FunctionComponent<Props> = ({
    tooltipMessage,
    ...tabProps
}) => {
    return (
        <Tooltip title={tooltipMessage} arrow placement="top">
            <span>
                <Tab label={tabProps.label} disabled={tabProps.disabled} />
            </span>
        </Tooltip>
    );
};

export default UsersDialogTabDisabled;
