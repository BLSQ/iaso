/* eslint-disable camelcase */
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { VRF } from '../types';

export const useTopBarTitle = (data: VRF): string => {
    const { formatMessage } = useSafeIntl();
    const creationMessage = formatMessage(MESSAGES.createVrf);
    if (!data) return creationMessage;
    const baseMessage = formatMessage(MESSAGES.supplyChainStatus);
    // TODO get country name i.o id
    const countryName = data.country_name;
    const obrName = data.campaign;
    const { rounds } = data;
    const roundTitle = rounds.length > 1 ? 'Rounds' : 'Round';

    return `${baseMessage}: ${countryName} - ${obrName} - ${roundTitle} ${rounds}`;
};
