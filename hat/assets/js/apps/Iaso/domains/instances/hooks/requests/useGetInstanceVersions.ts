/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { Instance } from '../../types/instances';

type InstanceVersions = {
    results: Instance[];
};

const getInstance = {};

const getInstanceVersions = {};

export const useGetInstanceVersions = {};
