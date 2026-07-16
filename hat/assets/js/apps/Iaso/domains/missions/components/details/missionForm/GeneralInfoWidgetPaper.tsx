import React from 'react';
import { InfoOutlined } from '@mui/icons-material';
import { Table, TableBody, Typography } from '@mui/material';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import { MissionFormRetrieve } from 'Iaso/api/missions';
import { WidgetPaperRow as Row } from 'Iaso/components/papers/WidgetPaperRow';
import { FormsChip } from 'Iaso/domains/missions/components/chips/FormsChip';
import MESSAGES from 'Iaso/domains/missions/messages';

type GeneralInfoWidgetPaperProps = {
    mission: MissionFormRetrieve;
};

export const GeneralInfoWidgetPaper: React.FunctionComponent<
    GeneralInfoWidgetPaperProps
> = ({ mission }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <Typography
                variant="body1"
                sx={{ textTransform: 'uppercase', mb: 2, fontSize: '15px' }}
            >
                <InfoOutlined
                    color="primary"
                    sx={{
                        mr: 1,
                        fontSize: '15px',
                        position: 'relative',
                        top: '2px',
                    }}
                />
                {formatMessage(MESSAGES.generalInfoTitle)}
            </Typography>
            <Table size="small">
                <TableBody>
                    <Row
                        showDivider={false}
                        field={{
                            label: formatMessage(MESSAGES.description),
                            value: mission.description || textPlaceholder,
                        }}
                    />
                    <Row
                        showDivider={false}
                        field={{
                            label: formatMessage(MESSAGES.missionType),
                            value: <FormsChip />,
                        }}
                    />
                </TableBody>
            </Table>
        </>
    );
};
