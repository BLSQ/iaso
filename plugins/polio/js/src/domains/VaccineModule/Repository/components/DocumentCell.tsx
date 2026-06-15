import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';

import { textPlaceholder } from 'bluesquare-components';
import { DateCell } from 'Iaso/components/Cells/DateTimeCell';
import { PdfPreview } from 'Iaso/components/files/pdf/PdfPreview';
import { SxStyles } from 'Iaso/types/general';
import { NO_PDF_COLOR, WITH_PDF_COLOR } from '../constants';
import { DocumentData } from '../types';
import { OpenButtonComponent } from './OpenButton';

export const CELL_HEIGHT = '40px';

const commonStyles = {
    borderRight: '1px solid white',
    borderBottom: '1px solid white',
    height: CELL_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
};

export const defaultStyles: SxStyles = {
    noPdf: {
        ...commonStyles,
        backgroundColor: NO_PDF_COLOR,
        cursor: 'default',
        color: 'white',
        '&:last-child': {
            borderBottom: 'none',
        },
    },
    withPdf: {
        ...commonStyles,
        backgroundColor: WITH_PDF_COLOR,
        cursor: 'pointer',
        color: 'white',
        '&:last-child': {
            borderBottom: 'none',
        },
    },
};

export const DocumentCell: FunctionComponent<DocumentData> = ({
    date,
    file,
}) => {
    if (!date && !file)
        return <Box sx={defaultStyles.noPdf}>{textPlaceholder}</Box>;
    if (!file)
        return <Box sx={defaultStyles.noPdf}>{DateCell({ value: date })}</Box>;
    return (
        <Box sx={defaultStyles.withPdf}>
            <PdfPreview
                pdf={file}
                OpenButtonComponent={OpenButtonComponent}
                buttonProps={{
                    date,
                }}
            />
        </Box>
    );
};
