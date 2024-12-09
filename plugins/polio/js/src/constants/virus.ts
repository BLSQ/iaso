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
    {
        value: 'PV1 & cVDPV2',
        label: 'cVDPV1 & cVDPV2',
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
    {
        value: 'nOPV & bOPV',
        label: 'nOPV & bOPV',
        color: '#00ff00',
    },
];

export const OTHER_VACCINE_COLOR = '#ea8418';

const useMapLegend = (): PolioVaccine[] => {
    const { formatMessage } = useSafeIntl();
    return [
        ...polioVaccines,
        {
            value: 'other',
            label: formatMessage(MESSAGES.other),
            color: OTHER_VACCINE_COLOR,
        },
    ];
};

export { polioVaccines, polioViruses, useMapLegend };
