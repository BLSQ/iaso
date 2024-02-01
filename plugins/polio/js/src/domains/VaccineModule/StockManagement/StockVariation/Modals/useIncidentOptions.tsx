import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import MESSAGES from '../../messages';
import { DropdownOptions } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/utils';

export const VM_REACHED_DISCARD_POINT = 'VM_REACHED_DISCARD_POINT';
export const VACCINE_EXPIRED = 'VACCINE_EXPIRED';
export const LOSSES = 'LOSSES';
export const RETURN_TO_SUPPLIER = 'RETURN_TO_SUPPLIER';
export const STEALING = 'STEALING';
export const PHYSICAL_INVENTORY = 'PHYSICAL_INVENTORY';

// from backend model.
// class StockCorrectionChoices(models.TextChoices):
// VVM_REACHED_DISCARD_POINT = "vvm_reached_discard_point", _("VVM reached the discard point")
// VACCINE_EXPIRED = "vaccine_expired", _("Vaccine expired")
// LOSSES = "losses", _("Losses")
// RETURN = "return", _("Return")
// STEALING = "stealing", _("Stealing")
// PHYSICAL_INVENTORY = "physical_inventory", _("Physical Inventory")


type IncidentType =
    | 'VACCINE_EXPIRED'
    | 'VM_REACHED_DISCARD_POINT'
    | 'LOSSES'
    | 'STEALING'
    | 'PHYSICAL_INVENTORY'
    | 'RETURN_TO_SUPPLIER';

export const useIncidentOptions = (): DropdownOptions<IncidentType>[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                label: formatMessage(MESSAGES[VM_REACHED_DISCARD_POINT]),
                value: VM_REACHED_DISCARD_POINT,
            },
            {
                label: formatMessage(MESSAGES[VACCINE_EXPIRED]),
                value: VACCINE_EXPIRED,
            },
            {
                label: formatMessage(MESSAGES[LOSSES]),
                value: LOSSES,
            },
            {
                label: formatMessage(MESSAGES[RETURN_TO_SUPPLIER]),
                value: RETURN_TO_SUPPLIER,
            },
            {
                label: formatMessage(MESSAGES[STEALING]),
                value: STEALING,
            },
            {
                label: formatMessage(MESSAGES[PHYSICAL_INVENTORY]),
                value: PHYSICAL_INVENTORY,
            },
        ].sort(
            (
                option1: DropdownOptions<IncidentType>,
                option2: DropdownOptions<IncidentType>,
            ) => option1.label.localeCompare(option2.label),
        ) as DropdownOptions<IncidentType>[];
    }, [formatMessage]);
};
