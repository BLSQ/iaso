import { Box } from '@mui/material';
import React, { FunctionComponent } from 'react';

import { textPlaceholder } from 'bluesquare-components';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { PdfPreview } from '../../../../../../../../hat/assets/js/apps/Iaso/components/files/pdf/PdfPreview';
import { SxStyles } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
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
        backgroundColor: 'rgba(215, 25, 28, 0.8)',
        cursor: 'default',
        color: 'white',
        '&:last-child': {
            borderBottom: 'none',
        },
    },
    withPdf: {
        ...commonStyles,
        backgroundColor: 'rgba(76, 175, 80,0.8)',
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
    if (!date) return <Box sx={defaultStyles.noPdf}>{textPlaceholder}</Box>;
    if (!file)
        return <Box sx={defaultStyles.noPdf}>{DateCell({ value: date })}</Box>;
    return (
        <Box sx={defaultStyles.withPdf}>
            <PdfPreview
                pdfUrl={file}
                OpenButtonComponent={OpenButtonComponent}
                buttonProps={{
                    date,
                }}
            />
        </Box>
    );
};
