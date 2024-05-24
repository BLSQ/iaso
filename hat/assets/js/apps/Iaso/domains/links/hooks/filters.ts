import { UseQueryResult } from 'react-query';
import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { DropdownOptions } from '../../../types/utils';
import MESSAGES from '../messages';

export const useGetAlgorithmsOptions = () => {
    return useSnackQuery({
        queryKey: ['algorithms'],
        queryFn: () => getRequest('/api/algorithms/'),
        options: {
            keepPreviousData: true,
            cacheTime: 600000,
            staleTime: 600000,
            select: data =>
                (data ?? []).map(a => ({
                    label: a.description,
                    value: a.id,
                })),
        },
    });
};
export const useGetAlgorithmRunsOptions = () => {
    const { formatMessage } = useSafeIntl();
    return useSnackQuery({
        queryKey: ['algorithmRun', formatMessage],
        queryFn: () => getRequest('/api/algorithmsruns/'),
        options: {
            keepPreviousData: true,
            cacheTime: 600000,
            staleTime: 600000,
            select: data =>
                (data ?? []).map(runItem => ({
                    label:
                        `${formatMessage(MESSAGES.from)} ${
                            runItem.source.data_source.name
                        } v${runItem.source.number}` +
                        ` ${formatMessage(MESSAGES.to)} ${
                            runItem.destination.data_source.name
                        } v${runItem.destination.number} (` +
                        `${runItem.algorithm_name})`,
                    value: runItem.id,
                })),
        },
    });
};

export const useGetOrgUnitTypesOptions = (): UseQueryResult<
    DropdownOptions<number>[]
> => {
    return useSnackQuery({
        queryKey: ['orgUnitTypes'],
        queryFn: () => getRequest('/api/v2/orgunittypes/'),
        options: {
            keepPreviousData: true,
            cacheTime: 600000,
            staleTime: 600000,
            select: data =>
                (data?.orgUnitTypes ?? []).map(orgUnitType => ({
                    label: orgUnitType.name,
                    value: orgUnitType.id,
                })),
        },
    });
};

export const useStatusOptions = (): DropdownOptions<'true' | 'false'>[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                label: formatMessage(MESSAGES.validated),
                value: 'true',
            },
            {
                label: formatMessage(MESSAGES.notValidated),
                value: 'false',
            },
        ];
    }, [formatMessage]);
};

export const useGetProfilesOptions = (): UseQueryResult<
    DropdownOptions<number>[]
> => {
    return useSnackQuery({
        queryKey: ['profiles', 'dropdown'],
        queryFn: () => getRequest('/api/profiles/'),
        options: {
            keepPreviousData: true,
            cacheTime: 600000,
            staleTime: 600000,
            select: data =>
                (data?.profiles ?? []).map(user => ({
                    label: user.user_name,
                    value: user.id,
                })),
        },
    });
};
export const useGetDataSources = (): UseQueryResult<any> => {
    return useSnackQuery({
        queryKey: ['sources'],
        queryFn: () => getRequest('/api/datasources/'),
        options: {
            keepPreviousData: true,
            cacheTime: 600000,
            staleTime: 600000,
            select: data => data?.sources,
        },
    });
};

export const useSourceDerivedValues = ({ sources, origin, destination }) => {
    return useMemo(() => {
        const sourceOptions = (sources ?? []).map(s => ({
            label: s.name,
            value: s.id,
        }));
        const currentOrigin = origin
            ? sources?.find(s => s.id === parseInt(origin, 10))
            : undefined;
        const currentDestination = origin
            ? sources?.find(s => s.id === parseInt(destination, 10))
            : undefined;
        return {
            sourceOptions,
            currentOrigin,
            currentDestination,
        };
    }, [destination, origin, sources]);
};

export const useSourceOptions = sources => {
    return useMemo(() => {
        return (sources ?? []).map(s => ({
            label: s.name,
            value: s.id,
        }));
    }, [sources]);
};

export const useSourceVersionOptions = ({ sources, source }) => {
    console.log('source', source, sources);

    const { formatMessage } = useSafeIntl();

    const currentSource = source
        ? sources?.find(s => s.id === parseInt(source, 10))
        : undefined;
    const versionsList = currentSource?.versions ?? [];
    const disabled = Boolean(
        !currentSource ||
            (currentSource && currentSource.versions.length === 0),
    );
    const options = versionsList.map(v => ({
        label: `${formatMessage(MESSAGES.version)} ${v.number}`,
        value: v.number,
    }));
    return useMemo(() => {
        return { source: currentSource, disabled, options };
    }, [currentSource, disabled, options]);
};
