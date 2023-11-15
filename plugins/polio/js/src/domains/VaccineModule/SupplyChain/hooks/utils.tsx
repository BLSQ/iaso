/* eslint-disable camelcase */
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

export const useTopBarTitle = (data: any): string => {
    const { formatMessage } = useSafeIntl();
    const creationMessage = formatMessage(MESSAGES.createVrf);
    if (!data) return creationMessage;
    const baseMessage = formatMessage(MESSAGES.supplyChainStatus);
    // TODO get country name i.o id
    const countryName = data.country;
    const obrName = data.campaign;
    const { rounds } = data;
    const roundTitle = rounds.length > 1 ? 'Rounds' : 'Round';

    return `${baseMessage}: ${countryName} - ${obrName} - ${roundTitle} ${rounds}`;
};

export const prepareData = (data: any[]) => {
    const toCreate: any[] = [];
    const toUpdate: any[] = [];
    const toDelete: any[] = [];
    data.forEach(item => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { to_delete, ...dataToPass } = item;
        if (item.id) {
            if (!to_delete) {
                toUpdate.push(dataToPass);
            } else {
                toDelete.push(dataToPass);
            }
        } else if (!to_delete) {
            // Temporary solution to handle users creating then deleting prealerts in the UI
            toCreate.push(dataToPass);
        }
    });
    return { toCreate, toUpdate, toDelete };
};
