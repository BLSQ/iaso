import { useSnackMutation } from 'Iaso/libs/apiHooks.ts';
import { postRequest, putRequest } from 'Iaso/libs/Api';
import { cloneDeep } from 'lodash';
import { convertToNumber } from 'bluesquare-components';
import { commaSeparatedIdsToStringArray } from '../../../../../hat/assets/js/apps/Iaso/utils/forms';

// we need this check because the select box returns the list in string format, but the api retirns an actual array
const formatGroupedCampaigns = groupedCampaigns => {
    if (typeof groupedCampaigns === 'string')
        return commaSeparatedIdsToStringArray(groupedCampaigns);
    return groupedCampaigns ?? [];
};

const convertFormattedNumbers = body => {
    const clonedBody = cloneDeep(body);
    body.rounds.forEach((round, index) => {
        if (round.shipments) {
            round.shipments.forEach((shipment, sIndex) => {
                if (shipment.vials_received) {
                    if (typeof shipment.vials_received === 'string') {
                        clonedBody.rounds[index].shipments[
                            sIndex
                        ].vials_received = convertToNumber(
                            shipment.vials_received,
                        );
                    }
                }
                if (shipment.po_numbers) {
                    if (typeof shipment.po_numbers === 'string') {
                        clonedBody.rounds[index].shipments[sIndex].po_numbers =
                            convertToNumber(shipment.po_numbers);
                    }
                }
            });
        }
        if (round.destructions) {
            round.destructions.forEach((destruction, dIndex) => {
                if (
                    destruction.vials_destroyed &&
                    typeof destruction.vials_destroyed === 'string'
                ) {
                    clonedBody.rounds[index].destructions[
                        dIndex
                    ].vials_destroyed = convertToNumber(
                        destruction.vials_destroyed,
                    );
                }
            });
        }
        if (
            round.forma_usable_vials &&
            typeof round.forma_usable_vials === 'string'
        ) {
            clonedBody.rounds[index].forma_usable_vials = convertToNumber(
                round.forma_usable_vials,
            );
        }
        if (
            round.forma_missing_vials &&
            typeof round.forma_missing_vials === 'string'
        ) {
            clonedBody.rounds[index].forma_missing_vials = convertToNumber(
                round.forma_missing_vials,
            );
        }
        if (
            round.forma_unusable_vials &&
            typeof round.forma_unusable_vials === 'string'
        ) {
            clonedBody.rounds[index].forma_unusable_vials = convertToNumber(
                round.forma_unusable_vials,
            );
        }
    });
    return clonedBody;
};

export const useSaveCampaign = () => {
    return useSnackMutation(
        body => {
            // TODO remove this hack when we get the real multiselect in polio
            const hackedBody = {
                ...body,
                grouped_campaigns: formatGroupedCampaigns(
                    body.grouped_campaigns,
                ),
            };
            const formattedBody = convertFormattedNumbers(hackedBody);
            return formattedBody.id
                ? putRequest(
                      `/api/polio/campaigns/${formattedBody.id}/`,
                      formattedBody,
                  )
                : postRequest('/api/polio/campaigns/', formattedBody);
        },
        undefined,
        undefined,
        ['polio', 'campaigns'],
    );
};
