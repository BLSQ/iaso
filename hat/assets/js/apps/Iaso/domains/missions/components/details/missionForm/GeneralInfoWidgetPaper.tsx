import React from 'react';
import { Table, TableBody } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { MissionFormRetrieve } from 'Iaso/api/missions';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { WidgetPaperRow as Row } from 'Iaso/components/papers/WidgetPaperRow';
import MESSAGES from 'Iaso/domains/missions/messages';

type GeneralInfoWidgetPaperProps = {
    mission: MissionFormRetrieve;
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
                            label: formatMessage(MESSAGES.missionType),
                            value: mission.mission_type.label,
                        }}
                    />
                </TableBody>
            </Table>
        </WidgetPaper>
    );
};
