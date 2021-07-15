import React, { useState, useCallback } from 'react';
import { bool, func, object } from 'prop-types';
import { TreeViewWithSearch } from './TreeViewWithSearch';
import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import { MESSAGES } from './messages';
import { iasoGetRequest } from '../../../../utils/requests';
import { getRootData, getChildrenData } from './requests';
import {
    OrgUnitLabel,
    getOrgUnitAncestorsIds,
    getOrgUnitAncestorsNames,
} from '../../utils';
import OrgUnitTooltip from '../OrgUnitTooltip';
import { OrgUnitTreeviewPicker } from './OrgUnitTreeviewPicker';
import { useSafeIntl } from 'bluesquare-components';

const OrgUnitTreeviewModal = ({
    // renderTrigger,
    titleMessage,
    toggleOnLabelClick,
    // onSelect,
    onConfirm,
}) => {
    const [allowConfirm, setAllowConfirm] = useState(false);
    const [selectedOrgUnit, setSelectedOrgUnit] = useState(null);
    const [selectedOrgUnitParents, setSelectedOrgUnitParents] = useState(null);
    // const [closeDialogCallback, setCloseDialogCallback] = useState(null);

    /**
     * @param {string} searchValue
     * @param {number} resultsCount
     */
    const request = async (searchValue, resultsCount) => {
        const url = `/api/orgunits/?searches=[{"validation_status":"VALID","search":"${searchValue}","defaultVersion":"true"}]&order=name&page=1&limit=${resultsCount}&smallSearch=true`;
        return iasoGetRequest({
            requestParams: { url },
            disableSuccessSnackBar: true,
            errorKeyMessage: 'Searching Org Units',
            consoleError: url,
        });
    };
    const onOrgUnitSelect = orgUnit => {
        setSelectedOrgUnit(orgUnit);
        setAllowConfirm(true);
    };

    const confirmOrgUnit = useCallback(async () => {
        const fullOrgUnit = await iasoGetRequest({
            requestParams: { url: `/api/orgunits/${selectedOrgUnit}` },
            disableSuccessSnackBar: true,
        });
        // console.log('full org unit', fullOrgUnit);
        const genealogy = getOrgUnitAncestorsNames(fullOrgUnit);
        console.log('genealogy', genealogy);
        setSelectedOrgUnitParents(genealogy);
        onConfirm(selectedOrgUnit);
    }, [selectedOrgUnit, onConfirm]);

    const modalConfirm = useCallback(
        // eslint-disable-next-line no-unused-vars
        closeDialog => {
            confirmOrgUnit();
            closeDialog();
            // setCloseDialogCallback(() => closeDialog);
        },
        [confirmOrgUnit],
    );

    const reset = () => {
        setSelectedOrgUnit(null);
    };

    const resetSelection = () => {
        setSelectedOrgUnit(null);
        setSelectedOrgUnitParents(null);
        onConfirm(null);
    }
    const tooltip = (orgUnit, icon) => (
        <OrgUnitTooltip orgUnit={orgUnit} enterDelay={0} enterNextDelay={0}>
            {icon}
        </OrgUnitTooltip>
    );

    return (
        <ConfirmCancelDialogComponent
            renderTrigger={({ openDialog }) => (
                <OrgUnitTreeviewPicker
                    onClick={openDialog}
                    selectedItems={selectedOrgUnitParents}
                    resetSelection={resetSelection}
                />
            )}
            // renderTrigger={renderTrigger}
            titleMessage={titleMessage}
            onConfirm={modalConfirm}
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
                makeDropDownText={orgUnit=><OrgUnitLabel orgUnit={orgUnit} withType/>}
                toolTip={tooltip}
                parseNodeIds={getOrgUnitAncestorsIds}
                // onIconClick={setSelectedOrgUnitParents}
                // onLabelClick={setSelectedOrgUnitParents}
            />
        </ConfirmCancelDialogComponent>
    );
};

OrgUnitTreeviewModal.propTypes = {
    renderTrigger: func.isRequired,
    titleMessage: object.isRequired,
    toggleOnLabelClick: bool,
    // onSelect: func,
    onConfirm: func,
};

OrgUnitTreeviewModal.defaultProps = {
    toggleOnLabelClick: true,
    // onSelect: () => {},
    onConfirm: () => {},
};

export { OrgUnitTreeviewModal };
