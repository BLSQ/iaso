import React, { FunctionComponent } from 'react';
import LinkIcon from '@mui/icons-material/Link';

type Props = { onClick: () => void; iconDisabled: boolean };

export const LinkReferenceInstancesButton: FunctionComponent<Props> = ({
    onClick,
    iconDisabled,
}) => {
    const iconProps = {
        onClick: !iconDisabled ? onClick : () => null,
        disabled: iconDisabled,
    };

    return (
        <LinkIcon
            color={iconDisabled ? 'disabled' : 'inherit'}
            {...iconProps}
        />
    );
};
