import { useTheme } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';
import { Vaccine } from './types';

const polioViruses = [
    // Legacy values
    // {
    //     value: 'PV1',
    //     label: 'PV1',
    // },
    // {
    //     value: 'PV2',
    //     label: 'PV2',
    // },
    // {
    //     value: 'PV3',
    //     label: 'PV3',
    // },
    {
        value: 'PV1',
        label: 'cVDPV1',
    },
    {
        value: 'PV3',
        label: 'cVDPV3',
    },
    {
        value: 'cVDPV2',
        label: 'cVDPV2',
    },
    {
        value: 'WPV1',
        label: 'WPV1',
    },
];

export type PolioVaccine = {
    value: Vaccine | 'other';
    label: string;
    color: string;
};
const polioVaccines: PolioVaccine[] = [
    {
        value: 'nOPV2',
        label: 'nOPV2',
        color: '#00b0f0',
    },
    {
        value: 'mOPV2',
        label: 'mOPV2',
        color: '#66ff66',
    },
    {
        value: 'bOPV',
        label: 'bOPV',
        color: '#ffff00',
    },
];

const useMapLegend = (): PolioVaccine[] => {
    const theme = useTheme();
    const { formatMessage } = useSafeIntl();
    return [
        {
            value: 'nOPV2',
            label: 'nOPV2',
            color: '#00b0f0',
        },
        {
            value: 'mOPV2',
            label: 'mOPV2',
            color: '#66ff66',
        },
        {
            value: 'bOPV',
            label: 'bOPV',
            color: '#ffff00',
        },
        {
            value: 'other',
            label: formatMessage(MESSAGES.other),
            color: theme.palette.secondary.main,
        },
    ];
};

export { polioVaccines, polioViruses, useMapLegend };
