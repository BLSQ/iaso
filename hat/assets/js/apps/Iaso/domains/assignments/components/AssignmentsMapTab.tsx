import React, { FunctionComponent } from 'react';
import { Grid } from '@material-ui/core';

import {
    // @ts-ignore
    Table,
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import { AssignmentsMap } from './AssignmentsMap';

import { AssignmentsApi } from '../types/assigment';
import { Planning } from '../types/planning';
import { Team } from '../types/team';
import { Column } from '../../../types/table';
import { IntlFormatMessage } from '../../../types/intl';

import MESSAGES from '../messages';

type Props = {
    assignments: AssignmentsApi;
    planning: Planning | undefined;
    currentTeam: Team | undefined;
};

const columns = (
    formatMessage: IntlFormatMessage,
    assignments: AssignmentsApi,
): Column[] => {
    return [
        {
            Header: formatMessage(MESSAGES.name),
            id: 'name',
            accessor: 'name',
        },
        {
            Header: formatMessage(MESSAGES.assignationsCount),
            id: 'assignationsCount',
            accessor: 'assignationsCount',
            Cell: settings => {
                return (
                    <div>
                        {
                            assignments.filter(
                                assignment =>
                                    assignment.team ===
                                    settings.row.original.id,
                            ).length
                        }
                    </div>
                );
            },
        },
    ];
};

export const AssignmentsMapTab: FunctionComponent<Props> = ({
    assignments,
    planning,
    currentTeam,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Grid container spacing={2}>
            <Grid item xs={5}>
                <Table
                    data={currentTeam?.sub_teams_details || []}
                    showPagination={false}
                    defaultSorted={[{ id: 'name', desc: false }]}
                    countOnTop={false}
                    marginTop={false}
                    columns={columns(formatMessage, assignments)}
                    count={currentTeam?.sub_teams_details?.length ?? 0}
                    onTableParamsChange={p =>
                        console.log('onTableParamsChange', p)
                    }
                />
            </Grid>
            <Grid item xs={7}>
                <AssignmentsMap assignments={assignments} planning={planning} />
            </Grid>
        </Grid>
    );
};
