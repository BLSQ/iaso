import React, { FunctionComponent } from 'react';
import AddLocationIcon from '@mui/icons-material/AddLocation';

type Props = { onClick: () => void; iconDisabled: boolean };

export const PushGpsModalButton: FunctionComponent<Props> = ({
    onClick,
    iconDisabled,
}) => {
    const iconProps = {
        onClick: !iconDisabled ? onClick : () => null,
        disabled: iconDisabled,
    };

    return (
        <AddLocationIcon
            color={iconDisabled ? 'disabled' : 'inherit'}
            {...iconProps}
        />
    );
};
