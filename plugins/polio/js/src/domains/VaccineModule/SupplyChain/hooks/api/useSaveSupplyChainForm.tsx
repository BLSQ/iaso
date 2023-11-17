/* eslint-disable camelcase */
import { UseMutationResult, useQueryClient } from 'react-query';
import { useDispatch } from 'react-redux';
import { useSnackMutation } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import {
    handlePromiseErrors,
    normalizePromiseResult,
    parsePromiseResults,
    saveTab,
} from './utils';
import { handleVrfPromiseErrors, saveVrf } from './vrf';
import { PREALERT, VAR, VRF } from '../../constants';
import { SupplyChainFormData, SupplyChainResponse } from '../../types';

const saveSupplyChainForm = async (supplyChainData: SupplyChainFormData) => {
    if (supplyChainData.saveAll === true && supplyChainData?.vrf?.id) {
        const promises: Promise<PromiseSettledResult<any>[]>[] = [];

        // update all tabs
        if (supplyChainData.changedTabs.includes(VRF)) {
            promises.push(Promise.allSettled(saveVrf(supplyChainData.vrf)));
        }
        if (supplyChainData.changedTabs.includes(PREALERT)) {
            promises.push(
                Promise.allSettled(saveTab(PREALERT, supplyChainData)),
            );
        }
        if (supplyChainData.changedTabs.includes(VAR)) {
            promises.push(Promise.allSettled(saveTab(VAR, supplyChainData)));
        }

        const allUpdates = (await Promise.allSettled(
            promises,
            // The first level of nesting will only contain fulfilled promised. The rejected ones will be at least 1 level deep
        )) as PromiseFulfilledResult<PromiseSettledResult<any>[]>[];
        return parsePromiseResults(allUpdates);
    }
    // We can't save prealerts or var if there's no preexisting vrf
    if (supplyChainData.saveAll === true) {
        const newVrf = await Promise.allSettled(saveVrf(supplyChainData.vrf));
        return {
            vrf: newVrf.map(item => normalizePromiseResult(item)),
        };
    }
    switch (supplyChainData.activeTab) {
        case VRF: {
            const newVrf = await Promise.allSettled(
                saveVrf(supplyChainData.vrf),
            );
            return {
                vrf: newVrf.map(item => normalizePromiseResult(item)),
            };
        }
        case VAR: {
            const newVars = await Promise.allSettled(
                saveTab(VAR, supplyChainData),
            );
            return {
                arrival_reports: newVars.map(item =>
                    normalizePromiseResult(item),
                ),
            };
        }
        case PREALERT: {
            const newPreAlerts = await Promise.allSettled(
                saveTab(PREALERT, supplyChainData),
            );
            return {
                pre_alerts: newPreAlerts.map(item =>
                    normalizePromiseResult(item),
                ),
            };
        }

        default:
            throw new Error(`Tab not recognized:${supplyChainData.activeTab}`);
    }
};

export const useSaveVaccineSupplyChainForm = (): UseMutationResult<
    any,
    any
> => {
    const queryClient = useQueryClient();
    const dispatch = useDispatch();
    // use queryClient.setQueryData to overwrite the cache. see optimistic updates in react query
    return useSnackMutation({
        mutationFn: saveSupplyChainForm,
        invalidateQueryKey: ['getVrfList'],
        showSucessSnackBar: false,
        ignoreErrorCodes: [400],
        options: {
            // Setting the cache value with the response onSuccess, so we can reset the form state (touched, etc) without losing data
            onSuccess: (
                data: SupplyChainResponse,
                variables: SupplyChainFormData,
            ) => {
                if (variables.saveAll && data) {
                    if (data.pre_alerts) {
                        const { pre_alerts } = data;

                        handlePromiseErrors(pre_alerts, dispatch);
                        queryClient.invalidateQueries('preAlertDetails');
                    }
                    if (data.arrival_reports) {
                        const { arrival_reports } = data;
                        handlePromiseErrors(arrival_reports, dispatch);
                        queryClient.invalidateQueries('arrivalReportsDetails');
                    }
                    if (data.vrf) {
                        const { vrf } = data;
                        handleVrfPromiseErrors(vrf, dispatch);
                        queryClient.invalidateQueries('getVrfList');
                        queryClient.invalidateQueries('getVrfDetails');
                    }
                } else {
                    if (variables.activeTab === PREALERT && data.pre_alerts) {
                        const { pre_alerts } = data;
                        handlePromiseErrors(pre_alerts, dispatch);
                        queryClient.invalidateQueries('preAlertDetails');
                    }
                    if (variables.activeTab === VAR && data.arrival_reports) {
                        const { arrival_reports } = data;
                        handlePromiseErrors(arrival_reports, dispatch);
                        queryClient.invalidateQueries('arrivalReportsDetails');
                    }
                    if (variables.activeTab === VRF && data.vrf) {
                        const { vrf } = data;
                        handleVrfPromiseErrors(vrf, dispatch);
                        queryClient.invalidateQueries('getVrfList');
                        queryClient.invalidateQueries('getVrfDetails');
                    }
                }
            },
        },
    });
};
