import React from 'react';
import { List, ListItem, ListItemText } from '@mui/material';
import ListItemAvatar from '@mui/material/ListItemAvatar';
// import { useSafeIntl } from 'bluesquare-components';
import { ListItemSecondaryText } from 'Iaso/domains/instances/components/ValidationWorkflow/timeline/ListItemSecondaryText';
import { AvatarTimeline } from './AvatarTimeline';

type SubmissionListProps = {
    totalSteps: number;
    instanceId: number;
    isMostRecent: boolean;
    timeline: any[];
};

export const SubmissionList = ({
    timeline,
    totalSteps,
    isMostRecent,
    instanceId,
}: SubmissionListProps) => {
    return (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {timeline?.map((timelineItem, idx) => {
                return (
                    <ListItem
                        alignItems="flex-start"
                        key={timelineItem.id}
                        sx={{
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            boxShadow: 1,
                        }}
                    >
                        <ListItemAvatar>
                            <AvatarTimeline
                                status={timelineItem.status}
                                type={timelineItem.type}
                            />
                        </ListItemAvatar>
                        <ListItemText
                            primary={`${timelineItem.name} (${timeline?.length - idx}/${totalSteps})`}
                            secondary={
                                <ListItemSecondaryText
                                    timelineItem={timelineItem}
                                    isMostRecent={isMostRecent}
                                    instanceId={instanceId}
                                />
                            }
                        ></ListItemText>
                    </ListItem>
                );
            })}
        </List>
    );
};
