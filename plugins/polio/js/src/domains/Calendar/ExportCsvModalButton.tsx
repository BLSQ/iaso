import React, { FunctionComponent } from 'react';
import { Button } from '@mui/material';
import { CsvSvg, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../constants/messages';

type Props = { onClick: () => void };

export const ExportCsvModalButton: FunctionComponent<Props> = ({ onClick }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Button
            type="button"
            color="primary"
            variant="contained"
            className="createCsv"
            onClick={onClick}
        >
            <CsvSvg />
            {formatMessage(MESSAGES.downloadScopesToCsv)}
        </Button>
    );
};
