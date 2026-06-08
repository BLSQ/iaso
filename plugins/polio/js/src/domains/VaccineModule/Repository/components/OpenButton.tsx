import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { DateCell } from 'Iaso/components/Cells/DateTimeCell';
import PdfSvgComponent from 'Iaso/components/svg/PdfSvgComponent';
import { DateAsString } from 'plugins/polio/js/src/constants/types';
import MESSAGES from '../messages';

type Props = {
    onClick: () => void;
    date?: DateAsString;
};

export const OpenButtonComponent: FunctionComponent<Props> = ({
    onClick,
    date,
}) => {
    const { formatMessage } = useSafeIntl();
    const dateNotFound = formatMessage(MESSAGES.dateNotFound);
    return (
        <Box
            role="button"
            onClick={onClick}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {date ? DateCell({ value: date }) : dateNotFound}
            <Box
                component="span"
                sx={{ marginLeft: 1, position: 'relative', top: 3 }}
            >
                <PdfSvgComponent sx={{ fontSize: '1.2rem' }} />
            </Box>
        </Box>
    );
};
