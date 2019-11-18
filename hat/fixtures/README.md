This document provides an easier overview of the test fixtures


## Locations

The IDs of the province, ZS, AS and village are hierarchical:
the village `1111` is in AS `111`, ZS `11` and province `1`.

| ID   | Province | ZS         | AS      | Village       |
|:-----|:---------|:-----------|:--------|:--------------|
| 1111 | Kwilu    | Mosango    | Muluma  | Kisala        |
| 1121 | Kwilu    | Mosango    | Muwanda | Muwando-koso  |
| 1511 | Kwilu    | Yasa Bonga | Yasa    | Bonga Village |
| 1521 | Kwilu    | Yasa Bonga | Pelo    | Pelo Kumbi    |
| 2111 | Kwango   | Boko       | Lonzo   | Munene        |

## Patients

| ID  | Name                 | Village ID |
|:----|:---------------------|:-----------|
| 101 | Henri IV de Bourbon  | 1111       |
| 102 | Marie de Medicis     | 1121       |
| 103 | Louis XIII de France | 1111       |
| 104 | Ana María Mauricia…  | 2111       |
| 105 | Louis XIV de Bourbon | 1111       |

## Cases

| ID | Source        | Patient | Village | Tests       |
|:---|:--------------|:--------|:--------|:------------|
| 1  | historic      | 101     | 1111    | no test     |
| 2  | historic      | 102     | 1511    | rdt+ maect- |
| 3  | mobile_backup | 103     | 1111    | rdt-        |
| 4  | mobile_backup | 104     | 1121    | catt+       |
| 5  | pv            | 101     | 1111    | ge+ pl_stg1 |

## Users

| Username           | Super | Scope  | Permissions | Password             |
|:-------------------|:------|:-------|:------------|:---------------------|
| root               | Yes   |        | -           |                      |
| admin              | Yes   |        |             | pwd                  |
| supervisor         |       |        |             | supervisorsupervisor |
| supervisor-kwilu   |       | Prov:1 |             | supervisorsupervisor |
| supervisor-mosango |       | ZS:11  |             | supervisorsupervisor |
| supervisor-muluma  |       | AS:111 |             | supervisorsupervisor |
| importer           |       |        |             | importerimporter     |
| full-exporter      |       |        |             |                      |
| anon-exporter      |       |        |             |                      |
| passive            |       |        |             | pwd                  |
| screener           |       |        |             | supervisorsupervisor |
| confirmer          |       |        |             | supervisorsupervisor |
| qc_admin           |       |        |             | supervisorsupervisor |

## Quality Control

| Base ID | Test type | result | Stage | QC2 | QC3 | Tester | Img/Vid? |
|:--------|:----------|:-------|:------|:----|:----|:-------|:---------|
| 150     | CATT      | +      | -     | +   |     | 11     | Image    |
| 151     | CATT      | +      | -     | -   |     | 11     | Image    |
| 152     | CATT      | +      | -     | -   |     | 11     | Image    |
| 153     | CATT      | +      | -     | +   | +   | 11     | Image    |
| 154     | CATT      | +      | -     | +   | -   | 11     | Image    |
| 155     | RDT       | +      | -     | -   |     | 11     | Image    |
| 156     | RDT       | +      | unk   |     |     | 11     | -        |
|         | PG        | +      |       | +   | +   | 12     | Video    |
| 157     | PG        | +      | unk   | +   | -   | 12     | Video    |
| 158     | PG        | +      | unk   | -   |     | 12     | Video    |
| 159     | PG        | -      | unk   | -   |     | 12     | Video    |
| 160     | PG        | -      | unk   |     |     | 10     | Video    |
| 161     | CATT      | +      | -     | +   | -   | 11     | Image    |
| 162     | CATT      | -      | -     |     |     | 11     | -        |
| 163     | CATT      | +      | stg 2 |     |     | 11     | -        |
|         | PL        | +      |       |     |     | 12     | -        |
| 164     | CATT      | +      | stg 1 |     |     | 11     | -        |
|         | PL        | - gb:2 |       |     |     | 12     | -        |
| 165     | CATT      | +      | stg 1 |     |     | 11     | -        |
|         | PL        | - gb:3 |       |     |     | 12     | -        |
