import React, { FunctionComponent, useMemo } from 'react';
import { Box } from '@mui/material';
import { ExcellSvg, useSafeIntl } from 'bluesquare-components';
import {
    DownloadMenuButton,
    DownloadOption,
} from 'Iaso/components/DownloadMenuButton';
import MESSAGES from './../messages';
import { exportUrl } from './../requests';
import { Filters } from './../types';

type Props = {
    filters: Filters;
    disabled?: boolean;
};

// The xlsx files are built by the server (which names them), then downloaded with a progress indicator
export const Exports: FunctionComponent<Props> = ({
    filters,
    disabled = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const options: DownloadOption[] = useMemo(
        () => [
            {
                key: 'eligible',
                extension: 'xlsx',
                label: formatMessage(MESSAGES.eligibleBeneficiaries),
                disabled: !filters.entity_type,
                tooltip: formatMessage(
                    filters.entity_type
                        ? MESSAGES.exportEligibleTooltip
                        : MESSAGES.exportEligibleDisabledTooltip,
                ),
                url: exportUrl('eligible', filters),
                icon: <ExcellSvg />,
            },
            {
                key: 'raw',
                extension: 'xlsx',
                label: formatMessage(MESSAGES.rawData),
                tooltip: formatMessage(MESSAGES.exportRawTooltip),
                url: exportUrl('raw', filters),
                icon: <ExcellSvg />,
            },
            {
                key: 'coda',
                extension: 'xlsx',
                label: formatMessage(MESSAGES.coda),
                tooltip: formatMessage(MESSAGES.exportCodaTooltip),
                url: exportUrl('coda', filters),
                icon: <ExcellSvg />,
            },
        ],
        [filters, formatMessage],
    );
    return (
        <Box display="flex" justifyContent="flex-end" mt={2}>
            <DownloadMenuButton options={options} disabled={disabled} />
        </Box>
    );
};
