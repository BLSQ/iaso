import React, { FunctionComponent, useCallback } from 'react';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { Button } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';
import domToPdf from 'dom-to-pdf';
import MESSAGES from '../../../constants/messages';

const pageWidth = 1980;

const useStyles = makeStyles(() => ({
    exportIcon: { marginRight: '8px' },
}));

type Props = {
    disabled?: boolean;
    setPdf: React.Dispatch<React.SetStateAction<boolean>>;
};

export const PdfExportButton: FunctionComponent<Props> = ({
    disabled,
    setPdf,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const createPDF = useCallback(async () => {
        const element = document.getElementById('pdf');
        const options = {
            filename: 'calendar.pdf',
            excludeClassNames: ['createPDF', 'createXlsx', 'createCsv'],
            overrideWidth: pageWidth,
        };

        await setPdf(true);

        document.body.style.width = `${pageWidth}px`;
        window.dispatchEvent(new Event('resize'));
        setTimeout(() => {
            domToPdf(element, options, async () => {
                await setPdf(false);
                document.body.style.width = 'auto';
                window.dispatchEvent(new Event('resize'));
            });
        }, 1000);
    }, [setPdf]);

    return (
        <Button
            onClick={createPDF}
            disabled={disabled}
            type="button"
            color="primary"
            variant="contained"
            className="createPDF"
        >
            <PictureAsPdfIcon className={classes.exportIcon} />
            {formatMessage(MESSAGES.exportToPdf)}
        </Button>
    );
};
