import { renderHook } from '@testing-library/react';
import {
    EDIT_ACCESS_COMPLETION_ONLY,
    EDIT_ACCESS_FULL,
    EDIT_ACCESS_NONE,
    RECEIVED,
    TEMPORARY,
} from '../../constants';
import { FormAEditAccess } from '../types';
import { useFormAUiState } from './useFormAUiState';

const render = (params: {
    isNew: boolean;
    editAccess: FormAEditAccess;
    originalStatus: string;
    currentStatus: string;
    withinEditWindow: boolean;
}) => renderHook(() => useFormAUiState(params)).result.current;

describe('useFormAUiState', () => {
    describe('new form (isNew = true)', () => {
        it('returns all fields editable when status is received', () => {
            const state = render({
                isNew: true,
                editAccess: EDIT_ACCESS_FULL,
                originalStatus: RECEIVED,
                currentStatus: RECEIVED,
                withinEditWindow: true,
            });

            expect(state.isTemporary).toBe(false);
            expect(state.canEditStatus).toBe(true);
            expect(state.canEditCampaignAndRound).toBe(true);
            expect(state.canEditReportDate).toBe(true);
            expect(state.canEditReceptionDate).toBe(true);
            expect(state.canEditVials).toBe(true);
            expect(state.canEditDosesPerVial).toBe(true);
            expect(state.canEditComment).toBe(true);
            expect(state.canEditFile).toBe(true);
        });

        it('locks reception date and file when status is temporary', () => {
            const state = render({
                isNew: true,
                editAccess: EDIT_ACCESS_FULL,
                originalStatus: RECEIVED,
                currentStatus: TEMPORARY,
                withinEditWindow: true,
            });

            expect(state.isTemporary).toBe(true);
            expect(state.canEditStatus).toBe(true);
            expect(state.canEditReceptionDate).toBe(false);
            expect(state.canEditFile).toBe(false);
            // Vials remain editable on new forms (wasOriginallyTemporary = false)
            expect(state.canEditVials).toBe(true);
        });
    });

    describe('existing form — EDIT_ACCESS_FULL, within edit window', () => {
        it('returns all fields editable when received', () => {
            const state = render({
                isNew: false,
                editAccess: EDIT_ACCESS_FULL,
                originalStatus: RECEIVED,
                currentStatus: RECEIVED,
                withinEditWindow: true,
            });

            expect(state.canEditStatus).toBe(true);
            expect(state.canEditCampaignAndRound).toBe(true);
            expect(state.canEditReportDate).toBe(true);
            expect(state.canEditReceptionDate).toBe(true);
            expect(state.canEditVials).toBe(true);
            expect(state.canEditDosesPerVial).toBe(true);
            expect(state.canEditComment).toBe(true);
            expect(state.canEditFile).toBe(true);
        });

        it('locks reception/file when temporary, locks vials when originally temporary', () => {
            const state = render({
                isNew: false,
                editAccess: EDIT_ACCESS_FULL,
                originalStatus: TEMPORARY,
                currentStatus: TEMPORARY,
                withinEditWindow: true,
            });

            expect(state.isTemporary).toBe(true);
            expect(state.canEditReceptionDate).toBe(false);
            expect(state.canEditFile).toBe(false);
            expect(state.canEditVials).toBe(false);
        });

        it('unlocks vials when originally temporary but current status switched to received', () => {
            const state = render({
                isNew: false,
                editAccess: EDIT_ACCESS_FULL,
                originalStatus: TEMPORARY,
                currentStatus: RECEIVED,
                withinEditWindow: true,
            });

            expect(state.canEditVials).toBe(true);
            expect(state.canEditReceptionDate).toBe(true);
            expect(state.canEditFile).toBe(true);
        });
    });

    describe('existing form — EDIT_ACCESS_FULL, past edit window', () => {
        it('disables status toggle for received form (prevents impossible received→temporary)', () => {
            const state = render({
                isNew: false,
                editAccess: EDIT_ACCESS_FULL,
                originalStatus: RECEIVED,
                currentStatus: RECEIVED,
                withinEditWindow: false,
            });

            expect(state.canEditStatus).toBe(false);
        });

        it('enables status toggle for originally temporary form (can still complete)', () => {
            const state = render({
                isNew: false,
                editAccess: EDIT_ACCESS_FULL,
                originalStatus: TEMPORARY,
                currentStatus: TEMPORARY,
                withinEditWindow: false,
            });

            expect(state.canEditStatus).toBe(true);
        });
    });

    describe('existing form — EDIT_ACCESS_COMPLETION_ONLY', () => {
        it('locks campaign/round/report/vials/doses, allows comment/reception/file for received', () => {
            const state = render({
                isNew: false,
                editAccess: EDIT_ACCESS_COMPLETION_ONLY,
                originalStatus: TEMPORARY,
                currentStatus: RECEIVED,
                withinEditWindow: false,
            });

            expect(state.canEditCampaignAndRound).toBe(false);
            expect(state.canEditReportDate).toBe(false);
            expect(state.canEditVials).toBe(false);
            expect(state.canEditDosesPerVial).toBe(false);

            expect(state.canEditComment).toBe(true);
            expect(state.canEditReceptionDate).toBe(true);
            expect(state.canEditFile).toBe(true);
        });

        it('locks reception date and file when current status is still temporary', () => {
            const state = render({
                isNew: false,
                editAccess: EDIT_ACCESS_COMPLETION_ONLY,
                originalStatus: TEMPORARY,
                currentStatus: TEMPORARY,
                withinEditWindow: false,
            });

            expect(state.canEditReceptionDate).toBe(false);
            expect(state.canEditFile).toBe(false);
            // Comment remains editable even in temporary state
            expect(state.canEditComment).toBe(true);
        });

        it('allows status toggle (temp → received completion)', () => {
            const state = render({
                isNew: false,
                editAccess: EDIT_ACCESS_COMPLETION_ONLY,
                originalStatus: TEMPORARY,
                currentStatus: TEMPORARY,
                withinEditWindow: false,
            });

            expect(state.canEditStatus).toBe(true);
        });
    });

    describe('existing form — EDIT_ACCESS_NONE', () => {
        it('disables all editing flags', () => {
            const state = render({
                isNew: false,
                editAccess: EDIT_ACCESS_NONE,
                originalStatus: RECEIVED,
                currentStatus: RECEIVED,
                withinEditWindow: false,
            });

            expect(state.canEditStatus).toBe(false);
            expect(state.canEditCampaignAndRound).toBe(false);
            expect(state.canEditReportDate).toBe(false);
            expect(state.canEditReceptionDate).toBe(false);
            expect(state.canEditVials).toBe(false);
            expect(state.canEditDosesPerVial).toBe(false);
            expect(state.canEditComment).toBe(false);
            expect(state.canEditFile).toBe(false);
        });
    });
});
