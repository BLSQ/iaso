import React, { FunctionComponent } from 'react';
import { ColorChip } from 'bluesquare-components';
import { Team } from '../types/team';

type Props = {
    team: Partial<Team>;
};

export const TeamChip: FunctionComponent<Props> = ({ team }) => {
    return <ColorChip label={team.name} size="small" />;
};
