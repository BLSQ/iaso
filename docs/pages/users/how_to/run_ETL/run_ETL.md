# IASO ETL

ETL is a script to extract and transform for entities data in the format expected by the Tableau dashboards.

Currently, it reads and writes to the same database as the Iaso installation. ETL script could be scheduled as periodic task. It means a task scheduled to run regulary. But It can also be a One-off Task, the schedule will only run the task a single time.


## How to View scheduled periodic tasks

From Iaso Admin page, in the Periodic Tasks section select Periodic tasks:

![Periodic tasks section](./attachments/Periodic-Tasks.png)

You will get a list of Scheduled tasks:

![Periodic tasks List](./attachments/Periodic-task-List.png)


## How to create ETL task as periodic task

From Iaso Admin page, in the Periodic Tasks list, on the top right side, there is a button **Add periodical task**:


![Add periodical task Button](./attachments/Add-periodical-task-Button.png)

You will get a form to create/edit a periodic task like ETL task:

![Period task forms](./attachments/Periodic-task-Iaso-Form.png)

There are 5 main fields:

- Name: task name
- Task (custom): a developed custom script
- Enabled: if is set to true, the task will run automatically
- Interval Schedule: the frequency of execution of the task when Enabled is set to True
- One-off Task: the schedule will only run the task a single time


Then click on **Save** to save the task!

In the periodic tasks list, when **Enabled** and/or **One-off Task** is set to true the circle icon will become green, otherwise it's red!


## How to run ETL


From Iaso Admin on the Periodic tasks page, select the ETL task to run, in the Action field above, select the action Run Selected Tasks:

![Run Period task](./attachments/Select-periodic-task-to-run.png)


Then click on the **Go** button:

![Run ETL Period task](./attachments/Run-periodic-task.png)

Note that the task queue is managed by Celery which is Distributed Task Queue!

Once the task finished to run, you can go on Celery Results section and open Task results, you will get a list of completed tasks ordered by completed datetime with for each row:

1. Period task name: wich is the Name of task
2. Task Name: the developed custom script
3. Completed datetime: the time when the script finished to run
4. Task state: **SUCCESS** if the task has ran successfull, **FAILURE** if it failled!

![Task results](./attachments/Task-results-list.png)


When the task ran successfull, it will populate the analyitics table with the entities data. 
From Iaso Admin page, you can find in the section WFP, all analyitic tables:

1. Beneficiaries: 
2. Journeys:
3. Visits:
4. Steps:
5. Monthly statisticss:

Note that in our case, there are 2 types of beneficiary: Children under 5 and Pregnant and Lactating Women(PLW)

### 1. Beneficiaries

It's an analytic table to store the basic beneficiary information:

- Birth date:  The beneficiary's birth date recorded in the admission visit

- Gender: The gender for the beneficiary, It used only for children unde 5 

- Entity id: Reference to entity id

- Account: reference to Project when multiple project share same database.

![Beneficiary](./attachments/Beneficiary.png)


### 2. Journeys

Analytic table to store beneficiary information from his admission in program to exit. When a beneficiary is admitted in program, it means in the current context a start of journey wich will end when he is discharged from the program. 

- Beneficiary: Reference to beneficiary id
- Admission Criteria: the criteria selected in the admission visit, eg: MUAC, WHZ
- Admission Type: the admission type selected in the admission visit. eg: New Case, Relapse, etc...
- Nutrion Programme: the program selected in the admission visit. eg: OTP, TSFP 
- Programme Type: It shows if the beneficiary is a child under 5 or pregnant/lactuting woman, e,g: U5, PLW
- Initial Weight: the weigth of beneficiary when admitted in the program
- Discharge Weight: the weigth of beneficiary when discharged in the program
- Start Date: the admission date
- End Date: the discharge date
- Duration : the length of stay(number of days between the admission date and disharge date). The journey duration
- Weight Gain: the average of weight gain when the difference between discharge weight and initial weight is positive
- Weight Loss: the difference between discharge weight and initial weight weight when it's negative
- Exit Type : the reason of disharge from program. e.g: Cured, Voluntary Withdrawal, Death, Defaulter, etc...
- Instance Id: reference to the instance when the beneficiary has been admitted in the program.

![Journey](./attachments/Journey.png)

### 3. Visits

Analytic table to store beneficiary visit information. For instance in nutrition program, there are 2 types of visits:

- admission: the first time when the beneficiary is admitted in the program

- followup: the successif visits when the beneficiary is already admitted into program

Here are the fields for the table:

- Date: admission or followup visit date
- Number: The number of current visit(admission visit is 0)
- Org unit: the org unit where happened the visit
- Journey: Reference to journey id where the visit belongs to

![Visit](./attachments/Visits.png)

### 4. Steps

In the context of nutrition program, a visit is splitted into 3 steps(anthropometric,medical and assistance).

Here is the fields for the table:


- Assistance type: the assistance type given during the medical or assistance visit. e.g: Amoxillin, Soap, Net, CSB, etc...

- Quantity given: the quantity given for assistance type.

- Visit: Reference to the linked visit

![Steps](./attachments/Steps.png)


For each analytics table, you will find in the rigth a filter to allow filtering data on various field values!

### 5. Monthly statisticss

An analyitic table to aggregate assistance data within visits based on the org unit the visits happened, period(month and year) and assistance type and quantity given.

For example, When there are 3 visits for 3 beneficiaries belong to same program type, nutrition program, admission type and admission criteria, happened in the same org unit, month and year, and within the visits various assistances have been given,
in this table, those 3 visits will be aggregated in 1 by adding together the quantities of assistance given for the same assistance type.

Here are the fields for the table:

1. Org Unit: the reference of org unit where the visits happened
2. Account: reference to Project when multiple project share same database.
3. Month: the month when the visits happened
4. Year: the month when the visits happened
5. Admission criteria: the admission criteria of all aggregated visits
6. Admission type: the admission type of all aggregated visits
7. Nutrition program:  the nutrition program of all aggregated visits
8. Program type: the program type of all aggregated visits
9. Number visits: the number of aggregated visits
10. Given sachet RUSF: the sum of all given quantity of RUSF(assistance type) during the assistance visits
11. Given sachet RUTF: the sum of all given quantity of RUTF(assistance type) during the assistance visits
12. Given quantity CSB: the sum of all CSB given during assistance type


![Monthly Statistics](./attachments/Monthly-statistics.png)


Note that in the rigth there is a filter to allow filtering data on various field values!





