# Using Form AI

The **Form AI** is an AI-powered assistant that lets you create and edit ODK XLSForms using plain language. Instead of building a form manually in a spreadsheet, you describe what you need in a chat, and Form AI generates a ready-to-use XLSForm for you.

## Prerequisites

Before you can use the Form AI, the following conditions must be met:

- The **Form AI** module must be activated for your organisation by an administrator (via **Settings → Modules**).
- Your user account must have the **Forms management** permission (`iaso_forms`).
- Your IASO account must have an **Anthropic API key** configured by an administrator. If the key is missing, the Copilot will return an error message asking you to contact your administrator.

## Accessing Form AI

In the left navigation menu, go to **Forms → Form AI**.

The page is split into two panels:

| Panel | Purpose |
|-------|---------|
| **Left – Chat** | Type your requests and see the conversation history. |
| **Right – Preview** | See a live preview of the generated form rendered as an ODK Web Form. |

## Creating a new form

1. Make sure no existing form is loaded (the "Load existing form" dropdown is empty).
2. Type a description of the form you want in the chat input at the bottom of the left panel.  
   *Example:* `Create a household survey with name, age, gender, and GPS location fields.`
3. Click **Send** (or press Enter).
4. The Copilot will generate the form and show:
   - A short explanation of what was created in the chat.
   - A live preview of the form in the right panel.
5. You can continue refining the form by sending follow-up messages.  
   *Example:* `Make the age field required and add a phone number question after the name.`

Each message is sent with the full conversation history, so the Copilot always has context of what was already created.

## Loading an existing form for editing

You can load an existing IASO form into the Copilot to modify it with AI assistance.

1. Click the **"Load existing form"** dropdown at the top of the left panel.
2. Search for and select the form you want to edit. Only forms that have at least one XLSForm version are listed.
3. The Copilot loads the form's current structure into the conversation context and displays a confirmation message.
4. Ask for modifications in the chat as you would for a new form.  
   *Example:* `Add a section for household assets and make the GPS question optional.`

!!! note
    When editing an existing form, the Copilot will always preserve the form's original ODK `form_id`. This ensures that saving the result as a new version passes IASO's consistency checks.

!!! note
    Modifying a form through the form copilot will lose the formatting (colors of cells for example) of the original xlsform.
      
## Saving the generated form

Once you are satisfied with the result, a **Save form** button appears in the bottom-right corner of the screen.

### Save as a new version of an existing form

If a form was loaded or previously saved:

1. Click **Save form**.
2. The dialog shows the name of the currently loaded form. Confirm by clicking **Save**.
3. A new form version is created in IASO. You can find it in **Forms → Form list** under the form's version history, or through the view properties button.

### Save as a brand-new form

If no form is loaded yet:

1. Click **Save form**.
2. Fill in the required fields:
   - **Form name** – the display name of the new form in IASO.
   - **Projects** – assign the form to one or more projects.
   - **Form ID (ODK)** *(optional)* – a unique snake_case identifier written into the XLS settings. Leave empty to use the AI-generated ID.
3. Click **Save**.
4. The new form appears in **Forms → Form list**.

## Downloading the XLSForm

At any point after a form has been generated, you can download the raw XLSForm Excel file:

1. In the right panel, click the **Download XLSForm** button.
2. A `.xlsx` file is saved to your computer.
3. You can open this file in Excel or LibreOffice Calc to inspect or further edit it before uploading it manually via **Forms → Form list → Create**.

## Tips for writing good prompts

- **Be specific about field types.** Instead of "add a question about vaccines", write "add a `select_multiple` question listing the vaccines received: OPV, IPV, Penta, MenA".
- **Ask for skip logic explicitly.** Example: "Show the pregnancy section only if gender is female".
- **Request grouping.** Example: "Group the household information questions under a section called 'Household details'".
- **Iterate step by step.** Make one change at a time rather than asking for many changes at once — this gives more predictable results.
- **Check the preview.** The right panel renders the form live; use it to verify the structure and question order before saving.

## Limitations

- The Copilot generates forms based on the standard ODK XLSForm specification. Highly custom or non-standard XLSForm features may not be handled correctly.
- The conversation history is managed client-side. Refreshing the page will clear the chat and the current form draft. Download or save your form before leaving the page.
- Only the most recent generated form is available for download or saving. Earlier drafts from the same session are not stored.
