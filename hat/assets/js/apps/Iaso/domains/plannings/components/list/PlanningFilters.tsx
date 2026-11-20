import React, { useMemo, useCallback } from 'react';
import Box from '@mui/material/Box/Box';
import { useRedirectTo, useSafeIntl } from 'bluesquare-components';
import {
    AddButton,
    FilterValues,
    FilterFieldDescriptor,
    FiltersPanel,
} from 'bluesquare-components';
import { Moment } from 'moment';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { dateFormat, getUrlParamDateObject } from 'Iaso/utils/dates';
import { PLANNING_WRITE } from 'Iaso/utils/permissions';
import { baseUrls } from '../../../../constants/urls';
import { publishingStatuses } from '../../constants';
import MESSAGES from '../../messages';
import { PlanningParams } from '../../types';

type Props = {
    params: PlanningParams;
};

const useStatusOptions = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () =>
            publishingStatuses.map(status => {
                return {
                    value: status,
                    label: formatMessage(MESSAGES[status]),
                };
            }),
        [formatMessage],
    );
};
const baseUrl = baseUrls.planning;

const urlParamToDate = (date?: string): Moment | undefined =>
    date ? getUrlParamDateObject(date) : undefined;

const dateToUrlParam = (date?: Moment | null): string | undefined =>
    date?.isValid() ? date.format(dateFormat) : undefined;

export const PlanningFilters = ({ params }: Props) => {
    const statusOptions = useStatusOptions();
    const redirectTo = useRedirectTo();

    const values: FilterValues = useMemo(
        () => ({
            search: params.search,
            dateFrom: urlParamToDate(params.dateFrom),
            dateTo: urlParamToDate(params.dateTo),
            publishingStatus: params.publishingStatus,
        }),
        [params],
    );

    const fields: FilterFieldDescriptor[] = useMemo(
        () => [
            { key: 'search', label: MESSAGES.search, type: 'search' },
            {
                key: 'dateFrom',
                label: MESSAGES.startDatefrom,
                type: 'date',
            },
            {
                key: 'dateTo',
                label: MESSAGES.endDateUntil,
                type: 'date',
            },
            {
                key: 'publishingStatus',
                label: MESSAGES.status,
                type: 'select',
                options: statusOptions,
                multi: false,
            },
        ],
        [statusOptions],
    );

    const handleApply = useCallback(
        (next: FilterValues) => {
            redirectTo(baseUrl, {
                ...params,
                page: '1',
                search: next.search || undefined,
                dateFrom: dateToUrlParam(next.dateFrom),
                dateTo: dateToUrlParam(next.dateTo),
                publishingStatus: next.publishingStatus || undefined,
            });
        },
        [params, redirectTo],
    );

    return (
        <Box display="flex" alignItems="center" gap={2}>
            <Box flexGrow={1} minWidth={0}>
                <FiltersPanel
                    fields={fields}
                    values={values}
                    onApply={handleApply}
                />
            </Box>{' '}
            <DisplayIfUserHasPerm permissions={[PLANNING_WRITE]}>
                <AddButton
                    message={MESSAGES.create}
                    onClick={() =>
                        redirectTo(baseUrls.planningDetails, {
                            mode: 'create',
                        })
                    }
                />
            </DisplayIfUserHasPerm>
        </Box>
    );
};
