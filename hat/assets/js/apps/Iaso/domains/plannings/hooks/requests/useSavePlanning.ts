/* eslint-disable camelcase */
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
    selectedOrgUnit: number[];
    selectedTeam: number;
    description?: string;
    project: number;
    publishingStatus: 'published' | 'draft';
};

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
    if (selectedOrgUnit !== undefined) {
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
export const convertAPIErrorsToState = data => {
    const { team, org_unit, ended_at, started_at, published_at, ...converted } =
        data;
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
    // callback?: () => void,
): UseMutationResult => {
    // const onSuccess = () => callback();

    const ignoreErrorCodes = [400];
    const editPlanning = useSnackMutation(
        (data: Partial<SavePlanningQuery>) => patchPlanning(data),
        undefined,
        undefined,
        ['planningsList'],
        undefined,
        // { onSuccess },
        ignoreErrorCodes,
    );
    const createPlanning = useSnackMutation(
        (data: SavePlanningQuery) => {
            return postPlanning(data);
        },
        undefined,
        undefined,
        ['planningsList'],
        undefined,
        ignoreErrorCodes,
    );
    const copyPlanning = useSnackMutation(
        (data: SavePlanningQuery) => duplicatePlanning(data),
        undefined,
        undefined,
        ['planningsList'],
        undefined,
        ignoreErrorCodes,
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
