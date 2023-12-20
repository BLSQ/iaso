import React, { useRef } from 'react';
import {
    commonStyles,
    mapPopupStyles,
    useSafeIntl,
} from 'bluesquare-components';
import { Popup } from 'react-leaflet';
import PopupItemComponent from 'Iaso/components/maps/popups/PopupItemComponent';
import { Card, CardContent } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { number, object, string } from 'prop-types';
import MESSAGES from '../../../constants/messages';
import { findDataForShape } from '../../../utils/index';

const style = theme => {
    return { ...commonStyles(theme), ...mapPopupStyles(theme) };
};

const useStyle = makeStyles(style);

export const LqasImPopup = ({ shape, data, round, campaign }) => {
    const classes = useStyle();
    const { formatMessage } = useSafeIntl();
    const ref = useRef();
    const dataForShape = findDataForShape({
        shape,
        data,
        round,
        campaign,
    });
    return (
        <>
            {dataForShape && (
                <Popup className={classes.popup} ref={ref} pane="popupPane">
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
            )}
        </>
    );
};

LqasImPopup.propTypes = {
    shape: object.isRequired,
    data: object.isRequired,
    round: number.isRequired,
    campaign: string,
};

LqasImPopup.defaultProps = {
    campaign: '',
};
export const makePopup =
    (LQASData, round, campaign = '') =>
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
