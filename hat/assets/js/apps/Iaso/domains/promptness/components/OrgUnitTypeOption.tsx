import React, { FunctionComponent, HTMLAttributes } from 'react';
import { Box, Checkbox, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';

type Props = {
    optionProps: HTMLAttributes<HTMLLIElement>;
    label: string;
    selected: boolean;
    notApplicable: boolean;
};

const styles: SxStyles = {
    option: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: '2px !important',
    },
    checkbox: {
        p: 0.5,
    },
    hint: {
        ml: 'auto',
        pl: 2,
        color: 'text.secondary',
    },
};

// Option of the org unit types dropdown, with a checkbox and a hint for the
// types where nothing is expected for the selected form
export const OrgUnitTypeOption: FunctionComponent<Props> = ({
    optionProps,
    label,
    selected,
    notApplicable,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Box component="li" {...optionProps} sx={styles.option}>
            <Checkbox
                size="small"
                checked={selected}
                sx={styles.checkbox}
                disableRipple
            />
            {label}
            {notApplicable && (
                <Typography variant="caption" sx={styles.hint}>
                    {formatMessage(MESSAGES.notApplicableType)}
                </Typography>
            )}
        </Box>
    );
};
