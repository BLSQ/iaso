import React, { FunctionComponent, useMemo } from 'react';
import moment from 'moment';
import { Grid, Box } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';

import { Analysis } from '../types';
import MESSAGES from '../messages';
import { useGetBeneficiaryTypesDropdown } from '../../hooks/requests';

type Props = {
    analysis: Analysis;
};
type Info = {
    label: string;
    value: string;
};

export const AnalysisTooltipTitle: FunctionComponent<Props> = ({
    analysis,
}) => {
    const { formatMessage } = useSafeIntl();
    const parameters: string[] = useMemo(
        () =>
            Object.entries(analysis.metadata.parameters).map(
                ([key, value]) => `${key}: ${value}`,
            ),
        [analysis.metadata.parameters],
    );
    const { data: entityTypesDropdown } = useGetBeneficiaryTypesDropdown();

    const entytypeName: string = useMemo(() => {
        if (entityTypesDropdown) {
            const type = entityTypesDropdown.find(
                entityType =>
                    entityType.value ===
                    parseInt(analysis.metadata.entity_type_id, 10),
            );
            return type?.label || '-';
        }
        return '';
    }, [analysis.metadata.entity_type_id, entityTypesDropdown]);

    const data: Info[] = useMemo(
        () => [
            {
                label: formatMessage(MESSAGES.algorithm),
                value: analysis.algorithm,
            },
            {
                label: formatMessage(MESSAGES.created_at),
                value: moment(analysis.created_at).format('LTS'),
            },
            {
                label: formatMessage(MESSAGES.finished_at),
                value: analysis.finished_at
                    ? moment(analysis.finished_at).format('LTS')
                    : '-',
            },
            {
                label: formatMessage(MESSAGES.fields),
                value: analysis.metadata.fields.join(','),
            },
            {
                label: formatMessage(MESSAGES.parameters),
                value: parameters.length > 0 ? parameters.join(',') : '-',
            },
            {
                label: formatMessage(MESSAGES.entityType),
                value: entytypeName,
            },
        ],
        [analysis, formatMessage, parameters, entytypeName],
    );
    return (
        <Box width={300}>
            <Grid container spacing={1}>
                <Grid item xs={5}>
                    {data.map(item => (
                        <Box
                            key={item.label}
                            justifyContent="flex-end"
                            display="flex"
                        >
                            {item.label}:
                        </Box>
                    ))}
                </Grid>
                <Grid item xs={7}>
                    {data.map((item, index) => (
                        <Box key={`${item.value}-${index}`} display="block">
                            {item.value}
                        </Box>
                    ))}
                </Grid>
            </Grid>
        </Box>
    );
};
