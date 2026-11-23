# Set up an ITN distribution campaign with AI

## Important to know before you start

!!! tip "Using another AI assistant?"
    This guide has been tested with Claude and ChatGPT. If you run into difficulties with
    another AI assistant, we're happy to collect your feedback:
    [contact us at products@bluesquarehub.com](mailto:products@bluesquarehub.com).

!!! warning "Using Claude? Prefer Claude Code"
    If you use Claude, preferably use **Claude Code** (desktop app or terminal) to avoid
    limitations. Claude in the browser or in its app can only reach domains on an allowed
    list: with an IASO server other than **app.openiaso.com**, get its domain allowed
    **before** the session (on Team and Enterprise plans, only an owner of your Claude
    organisation can add it: see the
    [tip at the end of step 4](#step-4-give-the-kit-to-your-ai-assistant)).

---

## Step 1: Create your IASO demo account

Create an IASO demo account on [openiaso.com/pricing](https://www.openiaso.com/pricing/). The
main user of this account has all the permissions the kit needs: use its credentials
throughout the test.

## Step 2: Download the kit

Download the IASO campaign kit, a zip file of instructions for the AI assistant:

- **[Campaign kit in English](./setup_bednet_campaign_with_ai_attachments/iaso-campaign-setup.zip)** (zip, 5.6 MB)

## Step 3: Give the kit access to your IASO account

The kit needs an **access key** (a "token") to work in your IASO account on your behalf.

1. Open this link and log in with your main user:
   **[https://app.openiaso.com/login/?next=/api/apitoken/](https://app.openiaso.com/login/?next=/api/apitoken/)**
2. The page shows a line like `{"token": "eyJ0eXAiOiJKV1Qi…"}`. Copy the long text between
   the second pair of quotes: this is your access key.
3. Decompress the ZIP file.
4. In the kit folder, open the file `iaso_config.txt` with a text editor (Notepad,
   TextEdit…).
5. Check that the `IASO_URL=` line says `https://app.openiaso.com`. Paste your access key
   after `IASO_TOKEN=`. Save the file.
6. Zip the kit folder again.

!!! warning "Keep your access key private"
    The access key works like your password. Never paste it into the conversation and never
    share the zip once it contains the key. Keep the kit with its key in a safe place: you
    need it to come back to the assistant and make changes later (see step 7).

## Step 4: Give the kit to your AI assistant

1. Start a new conversation in Claude or ChatGPT and attach the zip you saved in step 3 (it
   now contains your access key).
2. Choose where your geographic data comes from:

**Option A: Use the demo geographic data** (the kit's demo pyramid and example answers).
Copy this message, then go to [step 5](#step-5-answer-the-assistants-questions) to answer the
questions:

> Here is a kit to set up an ITN distribution campaign in IASO. Unzip it if needed, read
> `SKILL.md` and follow it step by step to guide me. Use only the kit's scripts, no IASO
> connector. This is a demo: use the kit's demo pyramid and propose placeholder answers for
> everything in one summary (demo mode). Confirm with me before each step that writes to
> IASO, and do not stop before the checklist of § 12c.

**Option B: Use your own geographic data.** Go to
[Use your own geographic data](#use-your-own-geographic-data) at the bottom of this page to
get the right message, then continue with [step 5](#step-5-answer-the-assistants-questions).

!!! tip "The assistant can't reach IASO?"
    The kit's scripts need to reach app.openiaso.com over the internet. If the assistant
    reports "Name or service not known" or says its code can't connect, its code is not
    allowed to reach that address:

    - **Claude, personal plan**: in **Settings > Capabilities**, allow code execution to
      access the network and add exactly `app.openiaso.com` (`openiaso.com` alone is not
      enough).
    - **Claude, Team or Enterprise plan**: only an owner of your Claude organisation can do
      it, in **Organization settings > Capabilities**. You can send them this message:
      *"Hello, I use Claude to set up a campaign in IASO. Could you add exactly
      app.openiaso.com to the domains Claude's code execution may reach (Organization
      settings > Capabilities)? Without it, Claude cannot reach our IASO server. Thank you!"*
    - **ChatGPT** and other assistants: check in their settings that code execution can
      access the internet, or this address.

    Then ask the assistant to try again.

## Step 5: Answer the assistant's questions

The assistant asks its questions one topic at a time (in a demo, it proposes all the answers
at once, in one summary to approve). It then builds the campaign step by step, asking for
your go-ahead each time: geographic data, projects, forms, registries, stock, users,
dashboards and mobile reports.

The assistant works in its own space: ask it to give you the files it produces (QR codes,
user passwords, backup) as downloads.

## Step 6: Test on a phone

1. **Install the IASO app** on an Android phone from
   [Google Play](https://play.google.com/store/apps/details?id=com.bluesquarehub.iaso&hl=en)
   (or scan the Play Store QR code the assistant gives you).
2. **Find the QR codes** in IASO: open the menu and go to **Admin > Projects**. Each mobile
   app project of the campaign is listed there, with its QR code ready to scan.
3. **Open the IASO app** on the phone, choose to scan a QR code and scan the QR code of the
   project to test. Accept the permission requests that show up (camera, location…).
4. **Log in** with your main user.
5. Follow the **guided test** the assistant proposes (register households, distribute nets,
   record a stock movement…).

## Step 7: After the setup

To change something in the campaign configuration, simply ask the AI assistant: go back to
the conversation where you attached the kit, which still contains your access key.

## Use your own geographic data

Use this option to configure the campaign with your real geographic data. Refer to the
[user guide](../users/reference/user_guide.md#data-sources-list) for more details on how to
format your GeoPackage or Excel file, or how to connect your DHIS2 instance. Then, in
[step 4](#step-4-give-the-kit-to-your-ai-assistant), use one of these messages instead of
the demo message.

### Your geographic data in an Excel file

Attach the Excel file to the conversation, together with the zip, and copy this message:

> Here is a kit to set up an ITN distribution campaign in IASO. Unzip it if needed, read
> `SKILL.md` and follow it step by step to guide me. Use only the kit's scripts, no IASO
> connector. My org units are in the attached Excel file. Ask me the campaign questions one
> section at a time. Confirm with me before each step that writes to IASO, and do not stop
> before the checklist of § 12c.

With a GeoPackage file, use this message and say "GeoPackage" instead of "Excel".

### Your geographic data in DHIS2

Your DHIS2 must already be set up on the data source in IASO. Copy this message:

> Here is a kit to set up an ITN distribution campaign in IASO. Unzip it if needed, read
> `SKILL.md` and follow it step by step to guide me. Use only the kit's scripts, no IASO
> connector. My org units come from our DHIS2, already set up on the IASO data source. Ask me
> the campaign questions one section at a time. Confirm with me before each step that writes
> to IASO, and do not stop before the checklist of § 12c.

### Prepare your campaign decisions

The more of these decisions you have already made, the quicker the configuration. The
assistant asks about them in [step 5](#step-5-answer-the-assistants-questions):

| Topic | Questions | Prepare |
|---|---|---|
| Campaign | name, country, form languages, districts covered, how many nets per household | the list of districts, the allocation rule |
| Geography | where your places come from, at which level households are registered (village, health facility…) | your DHIS2 settings in IASO, or your Excel or GeoPackage file |
| Projects | which mobile projects you need (enumeration, distribution, special groups, workers, stock, supervision) | — |
| Reports | which dashboards and mobile reports, the map of households and its place names, and who can open each page | the list of people who follow the campaign |
| Workers | the roles, daily rates, who validates attendance | the payment scale |
| Stock | the stores tracked, the number of nets per bale | the list of stores |
| Users | who uses which project, in which area | the list of agents |

## Learn more

- The kit contains a detailed guide (`GUIDE.html`) with the campaign phase by phase and
  screenshots of every tool.
- [IASO concepts](../users/reference/iaso_concepts.md) and [IASO modules](../users/reference/iaso_modules.md)
- [IASO mobile app](../users/reference/iaso_mobile.md)
