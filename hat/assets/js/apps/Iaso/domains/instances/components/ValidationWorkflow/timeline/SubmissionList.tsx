import React from 'react';
import { List, ListItem, ListItemText } from '@mui/material';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import { ListItemSecondaryText } from 'Iaso/domains/instances/components/ValidationWorkflow/timeline/ListItemSecondaryText';
import { Timeline } from 'Iaso/domains/validationWorkflowsConfiguration/types/validationNodes';
import { AvatarTimeline } from './AvatarTimeline';

type SubmissionListProps = {
    totalSteps: number;
    instanceId: number;
    timeline: Timeline[];
};

export const SubmissionList = ({
    timeline,
    totalSteps,
    instanceId,
}: SubmissionListProps) => {
    return (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {timeline?.map(timelineItem => {
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
                                userCanDoActions={
                                    timelineItem.user_can_do_actions
                                }
                            />
                        </ListItemAvatar>
                        <ListItemText
                            primary={`${timelineItem.name} (${timelineItem.order}/${totalSteps})`}
                            secondary={
                                <ListItemSecondaryText
                                    timelineItem={timelineItem}
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
