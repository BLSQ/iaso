import React, { useRef, FunctionComponent } from 'react';
import { Card, CardContent } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    mapPopupStyles,
    useSafeIntl,
} from 'bluesquare-components';
import { Popup } from 'react-leaflet';
import PopupItemComponent from 'Iaso/components/maps/popups/PopupItemComponent';

import MESSAGES from '../../../../constants/messages';
import { ConvertedLqasImData } from '../../../../constants/types';
import { findDataForShape } from '../../../../utils/index';

const style = theme => {
    return { ...commonStyles(theme), ...mapPopupStyles(theme) };
};

// @ts-ignore
const useStyle = makeStyles(style);

type Props = {
    shape: any;
    data: any;
    round: number | undefined;
    campaign?: string;
};

export const LqasImPopup: FunctionComponent<Props> = ({
    shape,
    data,
    round,
    campaign = '',
}) => {
    const classes: Record<string, string> = useStyle();
    const { formatMessage } = useSafeIntl();
    const ref = useRef();
    const dataForShape = findDataForShape({
        shape,
        data,
        round,
        campaign,
    });
    return dataForShape ? (
        // removing the pane prop causes zIndex bug
        // @ts-ignore
        <Popup ref={ref} pane="popupPane">
            <Card className={classes.popupCard}>
                <CardContent className={classes.popupCardContent}>
                    <PopupItemComponent
                        label={formatMessage(MESSAGES.district)}
                        value={shape.name}
                        labelSize={6}
                        valueSize={6}
                    />
                    <PopupItemComponent
                        label={formatMessage(MESSAGES.childrenChecked)}
                        value={dataForShape.total_child_checked}
                        labelSize={6}
                        valueSize={6}
                    />
                    <PopupItemComponent
                        label={formatMessage(MESSAGES.childrenMarked)}
                        value={dataForShape.total_child_fmd}
                        labelSize={6}
                        valueSize={6}
                    />
                </CardContent>
            </Card>
        </Popup>
    ) : null;
};

export const makePopup =
    (
        LQASData: Record<string, ConvertedLqasImData>,
        round: number | undefined,
        campaign = '',
    ) =>
    shape => {
        return (
            <LqasImPopup
                shape={shape}
                data={LQASData}
                round={round}
                campaign={campaign}
            />
        );
    };
