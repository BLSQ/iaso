import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { OrgUnitTreeviewModal } from 'Iaso/domains/orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { getRequest } from 'Iaso/libs/Api';
import {
    IntentRequest,
    IntentResult,
    isPickOrgUnit,
    pickedOrgUnitResult,
} from '../editor/utils';
import MESSAGES from '../messages';

type Pending = {
    request: IntentRequest;
    resolve: (result: IntentResult | null) => void;
};

/**
 * The phone's apps, for the form's external app questions (`intent`): the org unit picker (`pick_ou`) as IASO's
 * own; another app is refused, web-forms says so. The dialog to render, and the handler for `WebFormStep`.
 */
export const useIntentApps = (): {
    onIntent: (request: IntentRequest) => Promise<IntentResult | null>;
    intentDialog: ReactElement | null;
} => {
    const { formatMessage } = useSafeIntl();
    const [pending, setPending] = useState<Pending>();

    const onIntent = useCallback(
        (request: IntentRequest) => {
            if (!isPickOrgUnit(request.action)) {
                return Promise.reject(
                    new Error(
                        formatMessage(MESSAGES.intentNotSupported, {
                            action: request.action,
                        }),
                    ),
                );
            }
            return new Promise<IntentResult | null>(resolve =>
                setPending({ request, resolve }),
            );
        },
        [formatMessage],
    );

    const intentDialog = useMemo(() => {
        if (!pending) {
            return null;
        }
        const { request, resolve } = pending;
        const done = (result: IntentResult | null) => {
            resolve(result);
            setPending(undefined);
        };
        // ou_type: the org unit types the app lets pick
        const allowedTypes = (request.parameters.ou_type ?? '')
            .split(/[;,]/)
            .map(Number)
            .filter(type => type > 0);
        return (
            // the picker's own field isn't shown: only its dialog, opened at once
            <Box sx={{ display: 'none' }}>
                <OrgUnitTreeviewModal
                    titleMessage={MESSAGES.pickOrgUnit}
                    defaultOpen
                    toggleOnLabelClick
                    allowedTypes={allowedTypes}
                    onConfirm={orgUnit => {
                        if (!orgUnit) {
                            done(null);
                            return;
                        }
                        // the tree's org unit has no ancestors: the path needs them
                        getRequest(`/api/orgunits/${orgUnit.id}/`)
                            .then(detail =>
                                done(
                                    pickedOrgUnitResult(
                                        detail,
                                        request.parameters,
                                    ),
                                ),
                            )
                            .catch(() =>
                                done(
                                    pickedOrgUnitResult(
                                        orgUnit,
                                        request.parameters,
                                    ),
                                ),
                            );
                    }}
                    onCancel={() => done(null)}
                />
            </Box>
        );
    }, [pending]);

    return { onIntent, intentDialog };
};
