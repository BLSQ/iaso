import moment from 'moment';
import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import {
    dateRangePickerToDateApi,
    getApiParamDateTimeString,
} from '../../../../utils/dates';
import { endpoint } from '../../constants';

export type SavePlanningQuery = {
    id?: number;
    name: string;
    startDate: string;
    endDate: string;
    forms: number[];
    selectedOrgUnit: number;
    selectedTeam: number;
    description?: string;
    project: number;
    publishingStatus: 'published' | 'draft';
    pipelineUuids: string[];
    targetOrgUnitType: number;
};

const convertToApi = data => {
    const {
        selectedTeam,
        selectedOrgUnit,
        endDate,
        startDate,
        publishingStatus,
        pipelineUuids,
        targetOrgUnitType,
        ...converted
    } = data;
    if (selectedTeam !== undefined) {
        converted.team = selectedTeam;
    }
    if (selectedOrgUnit !== undefined) {
        converted.org_unit = selectedOrgUnit;
    }
    if (startDate !== undefined) {
        converted.started_at = dateRangePickerToDateApi(startDate, true);
    }

    if (endDate !== undefined) {
        converted.ended_at = dateRangePickerToDateApi(endDate, true);
    }
    if (publishingStatus === 'published') {
        converted.published_at = getApiParamDateTimeString(moment());
    } else if (publishingStatus === 'draft') {
        converted.published_at = null;
    }
    if (pipelineUuids !== undefined) {
        converted.pipeline_uuids = pipelineUuids;
    }
    if (targetOrgUnitType !== undefined) {
        converted.target_org_unit_type = targetOrgUnitType;
    }

    return converted;
};
export const convertAPIErrorsToState = data => {
    const {
        team,
        org_unit,
        ended_at,
        started_at,
        published_at,
        pipeline_uuids,
        ...converted
    } = data;
    if (team !== undefined) {
        converted.selectedTeam = team;
    }
    if (org_unit !== undefined) {
        converted.selectedOrgUnit = org_unit;
    }
    if (started_at !== undefined) {
        converted.startDate = started_at;
    }

    if (ended_at !== undefined) {
        converted.endDate = ended_at;
    }
    if (published_at !== undefined) {
        converted.publishingStatus = published_at;
    }
    if (pipeline_uuids !== undefined) {
        converted.pipelineUuids = pipeline_uuids;
    }

    return converted;
};

const patchPlanning = async (body: Partial<SavePlanningQuery>) => {
    const url = `${endpoint}${body.id}/`;
    return patchRequest(url, convertToApi(body));
};

const postPlanning = async (body: SavePlanningQuery) => {
    return postRequest({
        url: endpoint,
        data: convertToApi(body),
    });
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
): UseMutationResult => {
    const ignoreErrorCodes = [400];
    const editPlanning = useSnackMutation({
        mutationFn: (data: Partial<SavePlanningQuery>) => patchPlanning(data),
        invalidateQueryKey: ['planningsList', 'planning'],
        ignoreErrorCodes,
    });
    const createPlanning = useSnackMutation({
        mutationFn: (data: SavePlanningQuery) => {
            return postPlanning(data);
        },
        invalidateQueryKey: ['planningsList', 'planning'],
        ignoreErrorCodes,
    });
    const copyPlanning = useSnackMutation({
        mutationFn: (data: SavePlanningQuery) => duplicatePlanning(data),
        invalidateQueryKey: ['planningsList', 'planning'],
        ignoreErrorCodes,
    });

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
