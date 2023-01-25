import React from 'react';
import { IconButton } from 'bluesquare-components';
import tableColumns from './config/tableColumns';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';

import OrgUnitsTypesDialog from './components/OrgUnitsTypesDialog';

import { colOriginal } from '../../../../../test/utils';

let cols;
let wrapper;
let button;
let orgUnitsTypesDialog;
const fetchOrgUnitTypesSpy = sinon.spy();
const deleteOrgUnitTypeSpy = sinon.spy();
const deletePromise = () => {
    deleteOrgUnitTypeSpy();
    return new Promise(resolve => {
        resolve();
    });
};
describe('Org unit types config', () => {
    it('sould return an array of 8 columns', () => {
        cols = tableColumns(() => null, {
            props: {
                params: {},
            },
            fetchOrgUnitTypes: () => fetchOrgUnitTypesSpy(),
            deleteOrgUnitType: () => deletePromise(),
        });
        expect(cols).to.have.lengthOf(8);
    });
    it('should render a component if Cell is defined', () => {
        const settings = colOriginal({
            name: 'LINK',
            short_name: 'GANONDORF',
            depth: 0,
            projects: [],
            id: 1,
        });
        cols.forEach(c => {
            if (c.Cell) {
                const cell = c.Cell({
                    ...settings,
                    value:
                        typeof c.accessor === 'function'
                            ? c.accessor(settings.row.original)
                            : settings.row.original[c.accessor],
                });
                expect(cell).to.exist;
            }
        });
    });
    it('should call fetchOrgUnitTypes on click on onConfirmed', () => {
        const actionColumn = cols[cols.length - 1];
        wrapper = shallow(
            actionColumn.Cell(
                colOriginal({
                    projects: [],
                    id: 1,
                }),
            ),
        );
        orgUnitsTypesDialog = wrapper.find(OrgUnitsTypesDialog);

        expect(orgUnitsTypesDialog).to.have.lengthOf(1);
        orgUnitsTypesDialog.props().onConfirmed();
        expect(fetchOrgUnitTypesSpy).to.have.been.called;
    });
    it('should call fetchOrgUnitTypes on click on edit icon ', () => {
        const openDialogSpy = sinon.spy();
        wrapper = shallow(
            <div>
                {orgUnitsTypesDialog
                    .props()
                    .renderTrigger({ openDialog: () => openDialogSpy() })}
            </div>,
        );
        button = wrapper.find(IconButton);

        expect(button).to.have.lengthOf(1);
        button.props().onClick();
        expect(openDialogSpy).to.have.been.called;
    });
    it('should call fetchOrgUnitTypes on click on onConfirmed', () => {
        const actionColumn = cols[cols.length - 1];
        const closeDialogSpy = sinon.spy();
        wrapper = shallow(
            actionColumn.Cell(
                colOriginal({
                    projects: [],
                    id: 1,
                }),
            ),
        );
        const deleteDialog = wrapper.find(DeleteDialog);

        expect(deleteDialog).to.have.lengthOf(1);
        deleteDialog.props().onConfirm(() => closeDialogSpy());
        expect(deleteOrgUnitTypeSpy).to.have.been.called;
    });
    after(() => {
        sinon.restore();
    });
});
