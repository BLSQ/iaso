import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Table, UrlParams } from 'bluesquare-components';
import { defaultTableParams } from '../../../../../../../../hat/assets/js/apps/Iaso/constants/uiConstants';
import { useObjectState } from '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useObjectState';
import { useGetRoundDatesHistoryColumns } from './hooks/config';
import {
    DateLogsUrlParams,
    useGetRoundDatesHistory,
} from './hooks/useGetRoundDatesHistory';

type Props = {
    roundId?: number;
};

export const RoundDatesHistoryTable: FunctionComponent<Props> = ({
    roundId,
}) => {
    const [tableParams, setTableParams] = useObjectState({
        ...defaultTableParams,
        pageSize: 5,
        page: 1,
    });
    const columns = useGetRoundDatesHistoryColumns();

    const urlParams: DateLogsUrlParams = useMemo(() => {
        return { ...tableParams, roundId };
    }, [tableParams, roundId]);

    const onTableParamsChange = useCallback(
        (newParams: UrlParams) => {
            setTableParams(newParams);
        },
        [setTableParams],
    );
    const { data: datelogs, isFetching } = useGetRoundDatesHistory(urlParams);

    return (
        <Table
            onTableParamsChange={onTableParamsChange}
            params={tableParams}
            data={datelogs?.results ?? []}
            count={datelogs?.count}
            pages={datelogs?.pages ?? 1}
            columns={columns}
            extraProps={{ loading: isFetching }}
        />
    );
};
