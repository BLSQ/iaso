import { Box } from '@mui/material';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { PdfPreview } from '../../../../../../../../hat/assets/js/apps/Iaso/components/files/pdf/PdfPreview';
import { SxStyles } from '../../../../../../../../hat/assets/js/apps/Iaso/types/general';

import MESSAGES from '../messages';
import { DocumentData } from '../types';
import { defaultStyles } from './DocumentCell';
import { OpenButtonComponent } from './OpenButton';

type Props = DocumentData & {
    isRequired: boolean;
    isMissing: boolean;
};

const styles: SxStyles = {
    ...defaultStyles,
    notRequired: {
        ...defaultStyles.noPdf,
        backgroundColor: 'transparent',
        color: 'inherit',
    },
};
export const VrfDocumentCell: FunctionComponent<Props> = ({
    date,
    file,
    isRequired,
    isMissing,
}) => {
    const { formatMessage } = useSafeIntl();
    if (!date && !isRequired)
        return (
            <Box sx={styles.notRequired}>
                {formatMessage(MESSAGES.notRequired)}
            </Box>
        );
    if (!date && isMissing)
        return (
            <Box sx={styles.notRequired}>{formatMessage(MESSAGES.missing)}</Box>
        );
    if (!date) return <Box sx={styles.noPdf}>{textPlaceholder}</Box>;
    if (!file) return <Box sx={styles.noPdf}>{DateCell({ value: date })}</Box>;
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
