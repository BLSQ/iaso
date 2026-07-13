import React from 'react';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import { Table, TableBody } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { MissionEntityTypeRetrieve } from 'Iaso/api/missions';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { WidgetPaperRow as Row } from 'Iaso/components/papers/WidgetPaperRow';
import MESSAGES from 'Iaso/domains/missions/messages';

type GeneralInfoWidgetPaperProps = {
    mission: MissionEntityTypeRetrieve;
};

export const GeneralInfoWidgetPaper: React.FunctionComponent<
    GeneralInfoWidgetPaperProps
> = ({ mission }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <WidgetPaper
            title={formatMessage(MESSAGES.generalInfoTitle)}
            sx={{ mb: 2 }}
        >
            <Table size={'small'}>
                <TableBody>
                    <Row
                        field={{
                            label: formatMessage(MESSAGES.name),
                            value: mission.name,
                        }}
                    />
                    <Row
                        field={{
                            label: formatMessage(MESSAGES.description),
                            value: mission.description,
                        }}
                    />
                    <Row
                        field={{
                            label: formatMessage(MESSAGES.missionType),
                            value: mission.mission_type.label,
                        }}
                    />
                    <Row
                        field={{
                            label: formatMessage(MESSAGES.entityType),
                            value: mission.entity_type.name,
                        }}
                    />
                    <Row
                        field={{
                            label: formatMessage(MESSAGES.minCardinality),
                            value: mission.min_cardinality.toLocaleString(),
                        }}
                    />

                    <Row
                        field={{
                            label: formatMessage(MESSAGES.maxCardinality),
                            value: mission?.max_cardinality?.toLocaleString() ?? (
                                <AllInclusiveIcon
                                    fontSize="small"
                                    color="primary"
                                    aria-label={formatMessage(
                                        MESSAGES.infinity,
                                    )}
                                />
                            ),
                        }}
                    />
                </TableBody>
            </Table>
        </WidgetPaper>
    );
};
