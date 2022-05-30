import moment from 'moment';
import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import {
    dateRangePickerToDateApi,
    getApiParamDateTimeString,
} from '../../../../utils/dates';

export type SavePlanningQuery = {
    id?: number;
    name: string;
    startDate: string;
    endDate: string;
    forms: number[];
    selectedOrgUnit: number[];
    selectedTeam: number;
    description?: string;
    project: number;
    publishingStatus: 'published' | 'draft';
};

const endpoint = '/api/microplanning/planning/';

const convertToApi = data => {
    const {
        selectedTeam,
        selectedOrgUnit,
        endDate,
        startDate,
        publishingStatus,
        ...converted
    } = data;
    if (selectedTeam !== undefined) {
        converted.team = selectedTeam;
    }
    if (selectedTeam !== undefined) {
        converted.org_unit = selectedOrgUnit;
    }
    if (startDate !== undefined) {
        converted.started_at = dateRangePickerToDateApi(startDate);
    }

    if (endDate !== undefined) {
        converted.ended_at = dateRangePickerToDateApi(endDate);
    }
    if (publishingStatus === 'published') {
        converted.published_at = getApiParamDateTimeString(moment());
    } else if (publishingStatus === 'draft') {
        converted.published_at = null;
    }

    return converted;
};

const patchPlanning = async (body: Partial<SavePlanningQuery>) => {
    const url = `${endpoint}${body.id}/`;
    return patchRequest(url, convertToApi(body));
};

const postPlanning = async (body: SavePlanningQuery) => {
    return postRequest(endpoint, convertToApi(body));
};

const duplicatePlanning = async (body: SavePlanningQuery) => {
    const duplicate = { ...body };
    if (body.id) {
        delete duplicate.id;
    }
    return postPlanning(duplicate);
};

export const useSavePlanning = (
    type: 'create' | 'edit' | 'copy',
    callback: () => void,
): UseMutationResult => {
    const onSuccess = () => callback();
    const editPlanning = useSnackMutation(
        (data: Partial<SavePlanningQuery>) => patchPlanning(data),
        undefined,
        undefined,
        ['planningsList'],
        { onSuccess },
    );
    const createPlanning = useSnackMutation(
        (data: SavePlanningQuery) => {
            return postPlanning(data);
        },
        undefined,
        undefined,
        ['planningsList'],
        { onSuccess },
    );
    const copyPlanning = useSnackMutation(
        (data: SavePlanningQuery) => duplicatePlanning(data),
        undefined,
        undefined,
        ['planningsList'],
        { onSuccess },
    );

    switch (type) {
        case 'create':
            return createPlanning;
        case 'edit':
            return editPlanning;
        case 'copy':
            return copyPlanning;
        default:
            throw new Error(
                `wrong type expected: create, copy or edit, got:  ${type} `,
            );
    }
};
