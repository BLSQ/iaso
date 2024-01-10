import React, { FunctionComponent } from 'react';
import { CsvSvg, useSafeIntl } from 'bluesquare-components';
import { Button } from '@mui/material';
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
