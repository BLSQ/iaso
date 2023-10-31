import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

export const useTopBarTitle = (data: any): string => {
    const { formatMessage } = useSafeIntl();
    const baseMessage = formatMessage(MESSAGES.supplyChainStatus);
    if (!data) return baseMessage;
    const countryName = data.country.name;
    const obrName = data.obr_name;
    const rounds = data.rounds.map(round => round.number).join(', ');
    const roundTitle = rounds.length > 1 ? 'Rounds' : 'Round';

    return `${baseMessage}: ${countryName} - ${obrName} - ${roundTitle} ${rounds}`;
};
