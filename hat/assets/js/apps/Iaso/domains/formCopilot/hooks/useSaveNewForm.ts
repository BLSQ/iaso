import { useMutation } from 'react-query';
import { postRequest } from '../../../libs/Api';

type CreateFormPayload = {
    name: string;
    project_ids: number[];
    org_unit_type_ids: number[];
    periods_before_allowed: number;
    periods_after_allowed: number;
    single_per_period: boolean;
};

type CreateFormResponse = {
    id: number;
    name: string;
};

export const useCreateForm = () => {
    return useMutation<CreateFormResponse, Error, CreateFormPayload>(
        (data: CreateFormPayload) => postRequest('/api/forms/', data),
    );
};
