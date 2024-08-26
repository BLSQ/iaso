import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { IncidentReportFieldType } from '../StockVariation/Modals/CreateEditIncident';

export const useGetMovementDescription = () => {
    const { formatMessage } = useSafeIntl();

    return (movementType: IncidentReportFieldType, movement: number) => {
        if (movementType === 'plainMovement') {
            return formatMessage(MESSAGES.plainMovement, { movement });
        }
        if (movementType === 'missingMovement') {
            return formatMessage(MESSAGES.missingMovement, { movement });
        }
        return '';
    };
};
