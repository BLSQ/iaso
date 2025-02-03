import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import { DropdownOptions } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import MESSAGES from '../../messages';

export const VM_REACHED_DISCARD_POINT = 'vvm_reached_discard_point';
export const VACCINE_EXPIRED = 'vaccine_expired';
export const LOSSES = 'losses';
export const RETURN_TO_SUPPLIER = 'return';
export const STEALING = 'stealing';
export const PHYSICAL_INVENTORY_ADD = 'physical_inventory_add';
export const PHYSICAL_INVENTORY_REMOVE = 'physical_inventory_remove';
export const BROKEN = 'broken';
export const UNREADABLE_LABEL = 'unreadable_label';
// from backend model.
// class StockCorrectionChoices(models.TextChoices):
// VVM_REACHED_DISCARD_POINT = "vvm_reached_discard_point", _("VVM reached the discard point")
// VACCINE_EXPIRED = "vaccine_expired", _("Vaccine expired")
// LOSSES = "losses", _("Losses")
// RETURN = "return", _("Return")
// STEALING = "stealing", _("Stealing")
// PHYSICAL_INVENTORY_ADD = "physical_inventory_add", _("Add to Physical Inventory")
// PHYSICAL_INVENTORY_REMOVE = "physical_inventory_remove", _("rempove from Physical Inventory")

type IncidentType =
    | 'vaccine_expired'
    | 'vvm_reached_discard_point'
    | 'losses'
    | 'stealing'
    | 'physical_inventory'
    | 'broken'
    | 'unreadable_label'
    | 'return';

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
                label: formatMessage(MESSAGES[PHYSICAL_INVENTORY_ADD]),
                value: PHYSICAL_INVENTORY_ADD,
            },
            {
                label: formatMessage(MESSAGES[PHYSICAL_INVENTORY_REMOVE]),
                value: PHYSICAL_INVENTORY_REMOVE,
            },
            {
                label: formatMessage(MESSAGES[BROKEN]),
                value: BROKEN,
            },
            {
                label: formatMessage(MESSAGES[UNREADABLE_LABEL]),
                value: UNREADABLE_LABEL,
            },
        ].sort(
            (
                option1: DropdownOptions<IncidentType>,
                option2: DropdownOptions<IncidentType>,
            ) => option1.label.localeCompare(option2.label),
        ) as DropdownOptions<IncidentType>[];
    }, [formatMessage]);
};
