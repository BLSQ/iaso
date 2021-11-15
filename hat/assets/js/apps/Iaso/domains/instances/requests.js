import { getRequest } from '../../libs/Api';

export const fetchFormDetailsForInstance = formId =>
    getRequest(`/api/forms/${formId}/?fields=name,period_type,label_keys,id`);

export const fetchPossibleFields = async formId =>
    getRequest(`/api/forms/${formId}/?fields=possible_fields`);

export const fetchInstancesAsDict = url => getRequest(url);

export const fetchInstancesAsSmallDict = url => getRequest(url);
