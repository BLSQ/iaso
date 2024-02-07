import React, { ReactElement } from 'react';
import { FormStatRow } from '../types';
import MESSAGES from '../messages';
import { useSafeIntl } from 'bluesquare-components';

export const ItselfCell = ({value}: FormStatRow): ReactElement =>  {
    const { formatMessage } = useSafeIntl();
    return value.itself_target > 0 ? (
        <>
            {value.itself_has_instances ? (
                <span
                    title={formatMessage(
                        MESSAGES.itselfSubmissionCount,
                        {
                            value: value.itself_instances_count,
                        },
                    )}
                >
                    ✅
                </span>
            ) : (
                <>❌</>
            )}
        </>
    ) : (
        <div
            title={formatMessage(
                MESSAGES.itselfNoSubmissionExpected,
            )}
            style={{
                textDecoration:
                    'underline dotted',
            }}
        >
            N/A
        </div>
    );
};
