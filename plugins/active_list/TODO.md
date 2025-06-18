TODO list for Active List Plugin
--------------------------------
- bi-directional data exchange with IASO entities ✅
  - Record to xlsforms ✅
    - Registration ✅
    - Suivi ✅
  - submissions to IASO ✅
    - Registration ✅
    - Suivi ✅
- Automate regular data imports ✅

### General Improvements
- Ensure that excel download are in the same format as upload  ✅
- Improve the navigation: ensure that urls include the org unit and period
- Check permissions per person based on org units
- Ease navigation from dashboard to "/"

### Superset Dashboards
- Update superset dashboards with latest data model
- Ensure dashboards can be filtered on validated records

### Excel Upload Validation
- Give an easy to understand validation message ✅
- Validate ETS code at record upload (should be matching the org unit) ✅
- Handle correctly status when uploading records via excel (nv, etc .... )
- Think of what to do with records that are created twice (prevent reentry of the exact same record? )
- Test all import examples that we got
- Excel import should update the reference form of entities !!!! (age mainly)
- Ensure that period in excel imports are the same as the one declared in the web ui  ✅

### Data Validation
- validation per region ✅
- Adding indicators on the validation screen ✅
- Send emails on validation issues

### Bugs
- Format of periods from excel import does not match mobile import: https://fileactive-pnlsci.bluesquare.org/active_list/patient_history/?identifier=33355/56/78/90123  ✅
- Convert period to format 2025-06 when importing from excel format  ✅
- Files imported by CIV center have issues with the HIV type  ✅
- Dead patients are still marked as active ...
- Update validation forms on prod to allow codes with both e and E at the end  ✅
- Update the library version to use the code of Benjamin (and at least include constraints explanations in French)? 
- understand why identifier=00089/01/17/00095 is present in the active list in may 2025  ✅
- Double presentation of records here: http://localhost:8081/active_list/patient_history/?identifier=00089/01/19/00078&record_mode=all ✅
- colonne Etablissements validés pas correcte ici: http://localhost:8081/active_list/validation_region/ ✅
- on_time is not correctly calculated 
#
## Questions
- what to do when a patient is dead for the dispensiation date. Currently, import fails without date (and then where should they appear ? ) -> I'd say that the answer is dispensiation_date is reporting date in that case)
- explain a little better servi ailleurs/transfert in/transfert out 
- Shouldn't validation be more automated. It feels like we could define a few mechanical criteria for that, rather than asking everybody to check every month