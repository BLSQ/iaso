import React, { useState, useCallback } from 'react';
import { bool, func, object } from 'prop-types';
import { TreeViewWithSearch } from './TreeViewWithSearch';
import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import { MESSAGES } from './messages';
import { iasoGetRequest } from '../../../../utils/requests';
import { getRootData, getChildrenData } from './requests';
import { getOrgunitMessage } from '../../utils';
import OrgUnitTooltip from '../OrgUnitTooltip';

const OrgUnitTreeviewModal = ({
    renderTrigger,
    titleMessage,
    toggleOnLabelClick,
    onSelect,
    onConfirm,
}) => {
    const [allowConfirm, setAllowConfirm] = useState(false);

    /**
     * @param {string} searchValue
     * @param {number} resultsCount
     */
    const request = async (searchValue, resultsCount) => {
        const url = `/api/orgunits/?searches=[{"validation_status":"VALID","search":"${searchValue}"}]&order=name&page=1&limit=${resultsCount}&treeSearch=True`;
        return iasoGetRequest(url, {
            disableSuccessSnackBar: true,
            errorKeyMessage: 'Searching Org Units',
            consoleError: url,
        });
    };
    const onOrgUnitSelect = useCallback(
        orgUnit => {
            onSelect(orgUnit);
            setAllowConfirm(true);
        },
        [onSelect],
    );

    const tooltip = (orgUnit, icon) => (
        <OrgUnitTooltip orgUnit={orgUnit} enterDelay={0} enterNextDelay={0}>
            {icon}
        </OrgUnitTooltip>
    );

    return (
        <ConfirmCancelDialogComponent
            renderTrigger={renderTrigger}
            titleMessage={titleMessage}
            onConfirm={onConfirm}
            // eslint-disable-next-line no-unused-vars
            onClosed={reset}
            confirmMessage={MESSAGES.confirm}
            cancelMessage={MESSAGES.cancel}
            maxWidth="sm"
            allowConfirm={allowConfirm}
        >
            <TreeViewWithSearch
                labelField="name"
                nodeField="id"
                getChildrenData={getChildrenData}
                getRootData={getRootData}
                toggleOnLabelClick={toggleOnLabelClick}
                onSelect={onOrgUnitSelect}
                request={request}
                makeDropDownText={getOrgunitMessage}
                toolTip={tooltip}
            />
        </ConfirmCancelDialogComponent>
    );
};

OrgUnitTreeviewModal.propTypes = {
    renderTrigger: func.isRequired,
    titleMessage: object.isRequired,
    toggleOnLabelClick: bool,
    onSelect: func,
    onConfirm: func,
};

OrgUnitTreeviewModal.defaultProps = {
    toggleOnLabelClick: true,
    onSelect: () => {},
    onConfirm: () => {},
};

export { OrgUnitTreeviewModal };
