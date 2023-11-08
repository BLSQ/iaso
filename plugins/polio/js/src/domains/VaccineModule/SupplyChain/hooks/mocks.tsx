import { waitFor } from '../../../../../../../../hat/assets/js/apps/Iaso/utils';
import { VRF } from '../Details/VaccineSupplyChainDetails';

export const mockVRF = {
    vaccine_type: 'nOPV2',
    rounds: [1],
    campaign: 'DRC-11Prov-03-2022',
    date_vrf_signature: '2023-10-30T12:32:29.605243Z',
    date_vrf_reception: '2023-10-30T12:32:29.605243Z',
    date_dg_approval: '2023-10-30T12:32:29.605243Z',
    quantities_ordered_in_doses: 21,
    wastage_rate_used_on_vrf: 1.25,
    date_vrf_submission_dg: '2023-10-30T12:32:29.605243Z',
    date_rrt_orpg_approval: '2023-10-30T12:32:29.605243Z',
    quantities_approved_by_dg_in_doses: 21,
    quantities_approved_by_orpg_in_doses: 37,
    date_vrf_submission_to_orpg: '2023-10-30T12:32:29.605243Z',
    country: 29727,
    comment: 'Hello world',
    id: 1,
};

export const mockPatchVrf = (vrfData: Partial<VRF>) => {
    const activeKeys = Object.keys(vrfData);
    const alteredFields = {};
    activeKeys.forEach(key => {
        const field = vrfData[key];
        if (field && key !== 'id') {
            alteredFields[key] = field;
        }
    });
    const result = { ...mockVRF, ...alteredFields };

    // eslint-disable-next-line no-console
    console.log('PATCH RESULT', result);
    return result;
};

export const mockPostVrf = (vrfData: Partial<VRF>) => {
    const result = { ...vrfData, id: 21 };

    // eslint-disable-next-line no-console
    console.log('POST RESULT', result);
    return result;
};

export const mockSaveVrf = async (vrfData: Partial<VRF>) => {
    waitFor(200);
    if (vrfData.id) {
        return mockPatchVrf(vrfData);
    }
    return mockPostVrf(vrfData);
};
