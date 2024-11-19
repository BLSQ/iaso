import { Box } from '@mui/material';
import { textPlaceholder } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { PdfPreview } from '../../../../../../../../hat/assets/js/apps/Iaso/components/files/pdf/PdfPreview';
import { SxStyles } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { DocumentData } from '../types';
import { defaultStyles } from './DocumentCell';
import { OpenButtonComponent } from './OpenButton';

const LateStyle = {
    backgroundColor: 'rgba(255,216,53,0.8)',
    color: 'inherit',
};
const styles: SxStyles = {
    ...defaultStyles,
    isLatewithPdf: {
        ...defaultStyles.withPdf,
        ...LateStyle,
    },
    isLateNoFile: {
        ...defaultStyles.noPdf,
        ...LateStyle,
    },
};

type Props = DocumentData & {
    isLate: boolean;
};

export const FormADocumentCell: FunctionComponent<Props> = ({
    date,
    file,
    isLate,
}) => {
    if (!date) return <Box sx={styles.noPdf}>{textPlaceholder}</Box>;
    if (!file)
        return (
            <Box sx={isLate ? styles.isLateNoFile : styles.noPdf}>
                {DateCell({ value: date })}
            </Box>
        );

    const boxStyle = isLate ? styles.isLatewithPdf : styles.withPdf;
    console.log(boxStyle);
    return (
        <Box sx={boxStyle}>
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
