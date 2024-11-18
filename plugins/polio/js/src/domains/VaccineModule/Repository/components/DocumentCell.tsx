import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';

import { textPlaceholder } from 'bluesquare-components';
import { DocumentData } from '../types';
import { PdfPreview } from '../../../../../../../../hat/assets/js/apps/Iaso/components/files/pdf/PdfPreview';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { SxStyles } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { OpenButtonComponent } from './OpenButton';

const styles: SxStyles = {
    noPdf: {
        backgroundColor: 'rgba(215, 25, 28, 0.8)',
        cursor: 'default',
        border: '1px solid white',
        color: 'black',
    },
    withPdf: {
        backgroundColor: 'rgba(76, 175, 80,0.8)',
        cursor: 'pointer',
        border: '1px solid white',
        textDecorationLine: 'underline',
        color: 'blue',
    },
};

export const DocumentCell: FunctionComponent<DocumentData> = ({
    date,
    file,
}) => {
    if (!date) return <Box sx={styles.noPdf}>{textPlaceholder}</Box>;
    if (!file) return <Box sx={styles.noPdf}>{DateCell({ value: date })}</Box>;
    return (
        <Box sx={styles.withPdf}>
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
