import React, { useState, useCallback } from 'react';
import { bool, func, object } from 'prop-types';
import { TreeViewWithSearch } from './TreeViewWithSearch';
import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import { MESSAGES } from './messages';
import {
    getRootData,
    getChildrenData,
    searchOrgUnits,
    getOrgUnit,
} from './requests';
import {
    OrgUnitLabel,
    getOrgUnitAncestorsIds,
    getOrgUnitAncestorsNames,
} from '../../utils';
import OrgUnitTooltip from '../OrgUnitTooltip';
import { OrgUnitTreeviewPicker } from './OrgUnitTreeviewPicker';

const tooltip = (orgUnit, icon) => (
    <OrgUnitTooltip orgUnit={orgUnit} enterDelay={0} enterNextDelay={0}>
        {icon}
    </OrgUnitTooltip>
);

const getOrgUnitGenealogy = async orgUnit => {
    const fullOrgUnit = await getOrgUnit(orgUnit);
    return getOrgUnitAncestorsNames(fullOrgUnit);
};

const OrgUnitTreeviewModal = ({
    titleMessage,
    toggleOnLabelClick,
    // onSelect,
    onConfirm,
    multiselect,
}) => {
    // const [allowConfirm, setAllowConfirm] = useState(false);
    const [selectedOrgUnits, setSelectedOrgUnits] = useState();
    const [selectedOrgUnitParents, setSelectedOrgUnitParents] = useState([]);

    const onOrgUnitSelect = useCallback(
        orgUnit => {
            if (!multiselect) {
                setSelectedOrgUnits(orgUnit);
                // setAllowConfirm(true);
            }
        },
        [multiselect],
    );

    const onLabelClick = useCallback(
        orgUnits => {
            if (multiselect) setSelectedOrgUnits(orgUnits);
        },
        [multiselect, selectedOrgUnits],
    );

    const onModalConfirm = useCallback(
        async closeDialog => {
            if (!multiselect) {
                const genealogy = getOrgUnitGenealogy(selectedOrgUnits);
                setSelectedOrgUnitParents([genealogy]);
            } else {
                const genealogies = selectedOrgUnits.map(selectedOrgUnit =>
                    getOrgUnitGenealogy(selectedOrgUnit),
                );
                // launching all requests, waiting for the slowest one to finish
                Promise.all(genealogies).then(values => {
                    setSelectedOrgUnitParents(values);
                });
            }
            onConfirm(selectedOrgUnits);
            closeDialog();
        },
        [
            selectedOrgUnits,
            onConfirm,
            getOrgUnit,
            getOrgUnitAncestorsNames,
            multiselect,
        ],
    );

    const onModalCancel = () => {
        setSelectedOrgUnits(null);
    };

    const resetSelection = () => {
        setSelectedOrgUnits(null);
        setSelectedOrgUnitParents([]);
        onConfirm(null);
    };
    console.log('Modal selected org units', selectedOrgUnits);
    return (
        <ConfirmCancelDialogComponent
            renderTrigger={({ openDialog }) => (
                <OrgUnitTreeviewPicker
                    onClick={openDialog}
                    selectedItems={selectedOrgUnitParents}
                    resetSelection={resetSelection}
                />
            )}
            titleMessage={titleMessage}
            onConfirm={onModalConfirm}
            onCancel={onModalCancel}
            confirmMessage={MESSAGES.confirm}
            cancelMessage={MESSAGES.cancel}
            maxWidth="sm"
            allowConfirm={selectedOrgUnits?.length > 0}
        >
            <TreeViewWithSearch
                labelField="name"
                nodeField="id"
                getChildrenData={getChildrenData}
                getRootData={getRootData}
                toggleOnLabelClick={toggleOnLabelClick}
                onSelect={onOrgUnitSelect}
                request={searchOrgUnits}
                makeDropDownText={orgUnit => (
                    <OrgUnitLabel orgUnit={orgUnit} withType />
                )}
                toolTip={tooltip}
                parseNodeIds={getOrgUnitAncestorsIds}
                multiselect={multiselect}
                preselected={selectedOrgUnits}
                // preexpanded={selectedOrgUnitParents.flat()}
                // onIconClick={setSelectedOrgUnitParents}
                onLabelClick={onLabelClick}
            />
        </ConfirmCancelDialogComponent>
    );
};

OrgUnitTreeviewModal.propTypes = {
    titleMessage: object.isRequired,
    toggleOnLabelClick: bool,
    // onSelect: func,
    onConfirm: func,
    multiselect: bool,
};

OrgUnitTreeviewModal.defaultProps = {
    toggleOnLabelClick: true,
    // onSelect: () => {},
    onConfirm: () => {},
    multiselect: false,
};

export { OrgUnitTreeviewModal };
