# Create forms for entities

This document explains how to create forms for [entities](../../../users/reference/iaso_concepts/iaso_concepts.en.md#entities) and their [workflows](../../../users/reference/iaso_concepts/iaso_concepts.en.md#workflows).

## The profile

The profile (or reference form) is an [ODK form](../../../users/reference/iaso_concepts/iaso_concepts.en.md#questionnaires-or-xls-data-collection-forms) that contains all the entity's information.
Those information can be divided in two groups:
- General information (E.g.: first name, last name, address, phone number, license plate, vaccination card number, etc.)
- State information (E.g.: what program does this entity belongs to, how many kilometers has this entity traveled over time, etc.)

General information are usually entered by the user and are regular displayed questions in the forms (text, choices, etc.)
State information are [`calculate`](https://docs.getodk.org/form-logic/#calculations) questions with a default calculation (E.g.: `""`, `0`, etc.)

As a good practice, we keep the general information questions together at the top and state information questions together at the bottom.

### Example

A typical profile form would look like this:

| type      | name                   | label                  | calculation |
|-----------|------------------------|------------------------|-------------|
| text      | first_name             | First name             |             | 
| text      | last_name              | Last name              |             | 
| date      | birthday               | Birthday               |             |
| -         | -                      | -                      | -           |
| calculate | total_number_of_visits | Total number of visits | 0           |
| calculate | program                | Program                | ""          |

## Follow-up forms

Follow-up forms are forms which are presented based on the profile's value like defined in the workflow.
A follow-up form can access values from the profile and also override values in the profile (based on the changes configured in the workflow).

We usually split the follow-up forms in three parts:
- The `calculate` questions which declares the information we want to retrieve from the profile
- The form itself. In other words, the questions we want to ask the user.
- The `calculate` questions which declares the changes we want to apply to the profile

There is also an extra optional part which is a list of `note` questions which display the `calculate` questions that will override the profile.
This last part is optional but very useful to have a quick overview of what the values will be.

### Example

Let's imagine we would like to show a form that asks if the person showed up. If they did, we increment the number of visits, otherwise we leave it as is.

It would look like this:

| type              | name                            | label                                                                 | calculation                                                  |
|-------------------|---------------------------------|-----------------------------------------------------------------------|--------------------------------------------------------------|
| calculate         | first_name                      | First name                                                            | ""                                                           |
| calculate         | total_number_of_visits          | Total number of visits                                                | 0                                                            |
| -                 | -                               | -                                                                     | -                                                            |
| select_one yes_no | showed_up                       | Has ${first_name} showed up today?                                    |                                                              |
| -                 | -                               | -                                                                     | -                                                            |
| calculate         | new_total_number_of_visits      | New Total number of visits                                            | \${total_number_of_visits} + if(${showed_up} == "yes", 1, 0) |
| -                 | -                               | -                                                                     | -                                                            |
| note              | note_new_total_number_of_visits | The new total number of visits will be: ${new_total_number_of_visits} |                                                              |

## Tips and tricks

### Avoid changing profile's question names and types

Because entities can stay for a long time, when changing the profile, we try to migrate previous form versions to the new form versions.
When you change a question's name or type, this conversion can fail. You can also have weird side effects in the workflows.

Therefore, we highly advise that you try to have a stable profile form before you go to production and avoid changing the profile forms as much as possible.

### How to reduce the data size on the NFC card?

Entities can be stored on NFC cards. 
Therefore, reducing the size each forms take on the NFC card can greatly increase the amount of submissions we are able to store on the NFC card.

#### Omitting questions

By default, all submissions questions (except notes) are stored on the NFC cards. 
However, most "real" `calculate` questions can often be ignored (since their information can be computed based on the rest of the data).
Questions that can safely be ignored (question which can be recalculated) can pre prefixed by an underscore (`_`) to strip them from the binary stored on the NFC card.

Also, some questions like `first_name` in the previous example, which are just cosmetic, can be marked as omitted with the underscore to save space on the NFC card.

#### Choices values

When you have single/multi select questions, you need to think about how your choice value will be used. 
If you use it to override a value in the profile, try to use integer values instead of names. 
Names will take a lot of space on the NFC cards whereas integer are small.

Note: When the choices are only in one form (not transferred to a `calculate` question in the profile), their values have no impact.

##### Example

 **❌ BAD**

| list_name | name                                         | label                                              |
|-----------|----------------------------------------------|----------------------------------------------------|
| partners  | InternationalHumanitarianPartners(UNandNGOs) | International Humanitarian Partners (UN and INGOs) |
| partners  | NationalNGO                                  | National NGO                                       |
| partners  | GovernmentPartners                           | Government Partners                                |
| partners  | PrivatePartners                              | Private Partners                                   |

**✅ GOOD**

| list_name | name                                         | label                                              |
|-----------|----------------------------------------------|----------------------------------------------------|
| partners  | 1                                            | International Humanitarian Partners (UN and INGOs) |
| partners  | 2                                            | National NGO                                       |
| partners  | 3                                            | Government Partners                                |
| partners  | 4                                            | Private Partners                                   |

#### Type indicators

Due to a current limitation, hidden questions must be `calculate` questions. Those questions default to the type `string` which is very heavy when stored on the NFC card.

For `calculate` questions for which we know the type and we want to store on the NFC card (in the profile, mostly) we can suffix them with `__<type>__` as to improve their size.
The available types are as follows:

| Name ends with  | Type     |
|-----------------|----------|
| \_\_int__       | Integer  |
| \_\_integer__   | Integer  |
| \_\_long__      | Long     |
| \_\_decimal__   | Double   |
| \_\_double__    | Double   |
| \_\_bool__      | Boolean  |
| \_\_boolean__   | Boolean  |
| \_\_date__      | Date     |
| \_\_time__      | Time     |
| \_\_date_time__ | DateTime |
| \_\_datetime__  | DateTime |

Note: When using a type indicator in a profile question and then using this in a follow-up form, do not assume the value
is of the type mentioned. It's always a good practice to parse it correctly.

##### Example

| type      | name                    | label                 | calculation                                                                           |
|-----------|-------------------------|-----------------------|---------------------------------------------------------------------------------------|
| calculate | last_visit_date__date__ | Last visit date       | ""                                                                                    |
| calculate | days_since_last_visit   | Days since last visit | int(decimal-date-time(date(${last_visit_date__date__)) - decimal-date-time(today()))) |

See how `last_visit_date__date__` is surrounded by `date()` in the calculation.

### Display a calculate question

In the UI, sometimes we want to display the value of a `calculate` question.
In that case, a new `calculate` question with the prefix `_display_` can be added.
