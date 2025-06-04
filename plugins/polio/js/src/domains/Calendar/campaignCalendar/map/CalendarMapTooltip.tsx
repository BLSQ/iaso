/* eslint-disable react/require-default-props */
import { useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { Tooltip } from 'react-leaflet';
import MESSAGES from '../../../../constants/messages';

type Props = {
    type: 'regular' | 'merged';
    campaign: string;
    country: string;
    region?: string;
    district?: string;
    vaccine?: string;
    vaccines?: string;
};

export const CalendarMapTooltip: FunctionComponent<Props> = ({
    type,
    campaign,
    country,
    region = '',
    district = '',
    vaccine,
    vaccines,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            {/* @ts-ignore TODO: fix this type problem */}
            <Tooltip pane="popupPane">
                <div>
                    {formatMessage(MESSAGES.campaign)}
                    {`: ${campaign}`}
                </div>
                <div>
                    {formatMessage(MESSAGES.country)}
                    {`: ${country}`}
                </div>
                {type === 'regular' && (
                    <>
                        <div>
                            {formatMessage(MESSAGES.region)}
                            {`: ${region}`}
                        </div>
                        <div>
                            {formatMessage(MESSAGES.district)}
                            {`: ${district}`}
                        </div>
                    </>
                )}
                {vaccines ? (
                    <div>
                        {formatMessage(MESSAGES.vaccines)}
                        {`: ${vaccines}`}
                    </div>
                ) : (
                    <div>
                        {formatMessage(MESSAGES.vaccine)}
                        {`: ${vaccine || formatMessage(MESSAGES.other)}`}
                    </div>
                )}
            </Tooltip>
        </>
    );
};
