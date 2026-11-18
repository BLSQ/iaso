# Set up an ITN distribution campaign with AI

*Configure IASO for a mass distribution of insecticide-treated nets (ITNs) with the help of an AI assistant.*

This guide is for campaign coordinators and IT focal points who want to use IASO to plan and
monitor an ITN campaign. You don't need to be a developer: an AI assistant (Claude,
ChatGPT…) does the technical work, asks you questions about your campaign and waits for your
go-ahead before changing anything in IASO. It makes the campaign configuration quicker,
especially if most of the campaign decisions are already made.

## Before you start

| You need | Details |
|---|---|
| An **IASO account** | You can create a free trial on [openiaso.com/pricing](https://www.openiaso.com/pricing/). |
| An **AI assistant** | One that can run Python code and reach your IASO server: Claude or ChatGPT in the browser or in their app, or Claude Code (desktop app or terminal) with Python 3 on your computer. |
| Your **files and campaign decisions** | Only if you want to test with your real campaign data. Your geographic data (from DHIS2, an Excel file or a GeoPackage file: the assistant imports it for you, or you can [import it yourself](../users/reference/user_guide.md#import-a-pyramid-into-a-data-source)) and the campaign decisions: districts covered, net allocation rule, roles and daily rates of workers, list of stores, list of agents (see the assistant's questions in [step 5](#step-5-answer-the-assistants-questions)). Otherwise, the assistant can propose demo data so you can test the setup first. |
| An **Android phone** | With the [IASO app from Google Play](https://play.google.com/store/apps/details?id=com.bluesquarehub.iaso&hl=en), to test the mobile projects. |

!!! tip "Using another AI assistant?"
    This guide has been tested with Claude and ChatGPT. If you run into difficulties with
    another AI assistant, we're happy to collect your feedback:
    [contact us at products@bluesquarehub.com](mailto:products@bluesquarehub.com).

!!! note "Your IASO address"
    Everything in this guide happens on **[https://app.openiaso.com](https://app.openiaso.com/)**.
    Trial accounts already have every module the campaign needs (forms, entities, stock
    management, embedded links, DHIS2 mapping).

---

## Part 1: Prepare your IASO account

### Step 1: Open your IASO account

1. Go to your IASO account on [app.openiaso.com](https://app.openiaso.com/), or create one on
   [openiaso.com/pricing](https://www.openiaso.com/pricing/).
2. Choose the **user for the setup**: the assistant works in IASO as this user. You can use
   the main user of your newly created account: it already has all the permissions the kit
   needs (listed in `SKILL.md`, section 1). Ideally, create a dedicated user for the setup.

---

## Part 2: Configure the campaign with the campaign kit

The **IASO campaign kit** is a zip file of instructions, forms, templates and small scripts
written for an AI assistant. It is not software to install: you give it to the assistant,
which follows it step by step to build your campaign in IASO. The assistant works in IASO
with the kit's own scripts and the access key you give it in step 3.

### Step 2: Download the kit

Download the kit in the language you want the assistant to work in, and unzip it on your
computer:

- **[Campaign kit in English](./setup_bednet_campaign_with_ai_attachments/iaso-campaign-setup.zip)** (zip, 5.6 MB)
- **[Campaign kit in French](./setup_bednet_campaign_with_ai_attachments/iaso-campaign-setup-fr.zip)** (zip, 6.1 MB)

Both kits contain the same forms, with English and French labels.

### Step 3: Give the kit access to your IASO account

The kit needs an **access key** (a "token") to work in your IASO account on your behalf.

1. Open this link and log in with the user for the setup:
   **[https://app.openiaso.com/login/?next=/api/apitoken/](https://app.openiaso.com/login/?next=/api/apitoken/)**
2. The page shows a line like `{"token": "eyJ0eXAiOiJKV1Qi…"}`. Copy the long text between
   the second pair of quotes: this is your access key.
3. In the kit folder, open the file `iaso_config.txt` with a text editor (Notepad,
   TextEdit…).
4. Check that the `IASO_URL=` line says `https://app.openiaso.com`. Paste your access key
   after `IASO_TOKEN=`. Save the file.
5. Zip the kit folder again.

!!! warning "Keep your access key private"
    The access key works like your password. Never paste it into the conversation and never
    share the zip once it contains the key. Keep the kit with its key in a safe place: you
    need it to come back to the assistant and make changes later (see step 7).

### Step 4: Give the kit to your AI assistant

1. Start a new conversation in Claude or ChatGPT and attach the zip, plus your Excel or
   GeoPackage file if you have one. (With Claude Code, open it in the kit folder instead.)
2. Copy one of these messages as it is, depending on where your geographic data comes from.

**A demo, to try the kit** (the kit's demo pyramid and example answers):

> Here is a kit to set up an ITN distribution campaign in IASO. Unzip it if needed, read
> `SKILL.md` and follow it step by step to guide me. Use only the kit's scripts, no IASO
> connector. This is a demo: use the kit's demo pyramid and propose placeholder answers for
> everything in one summary (demo mode). Confirm with me before each step that writes to
> IASO, and do not stop before the checklist of § 12c.

**Your geographic data in an Excel file** (attached to the conversation):

> Here is a kit to set up an ITN distribution campaign in IASO. Unzip it if needed, read
> `SKILL.md` and follow it step by step to guide me. Use only the kit's scripts, no IASO
> connector. My org units are in the attached Excel file. Ask me the campaign questions one
> section at a time. Confirm with me before each step that writes to IASO, and do not stop
> before the checklist of § 12c.

**Your geographic data in DHIS2** (already set up on the data source in IASO):

> Here is a kit to set up an ITN distribution campaign in IASO. Unzip it if needed, read
> `SKILL.md` and follow it step by step to guide me. Use only the kit's scripts, no IASO
> connector. My org units come from our DHIS2, already set up on the IASO data source. Ask me
> the campaign questions one section at a time. Confirm with me before each step that writes
> to IASO, and do not stop before the checklist of § 12c.

**Your geographic data already in IASO**:

> Here is a kit to set up an ITN distribution campaign in IASO. Unzip it if needed, read
> `SKILL.md` and follow it step by step to guide me. Use only the kit's scripts, no IASO
> connector. My org units are already in IASO. Ask me the campaign questions one section at a
> time. Confirm with me before each step that writes to IASO, and do not stop before the
> checklist of § 12c.

If you are unsure, start with the demo: it builds everything on fictitious places, and you see
the result before preparing your own data. With a GeoPackage file, use the Excel message and
say "GeoPackage" instead of "Excel".

The assistant works in its own space: ask it to give you as downloads the files it produces
(QR codes, user passwords, backup).

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

### Step 5: Answer the assistant's questions

The assistant asks its questions one topic at a time (in a demo, it proposes all the answers
at once, in one summary to approve). The more of these decisions you have already made, the
quicker the configuration:

| Topic | Questions | Prepare |
|---|---|---|
| Campaign | name, country, form languages, districts covered, how many nets per household | the list of districts, the allocation rule |
| Geography | where your places come from, at which level households are registered (village, health facility…) | your DHIS2 settings in IASO, or your Excel or GeoPackage file |
| Projects | which mobile projects you need (enumeration, distribution, special groups, workers, stock, supervision) | — |
| Reports | which dashboards and mobile reports, the map of households and its place names, and who can open each page | the list of people who follow the campaign |
| Workers | the roles, daily rates, who validates attendance | the payment scale |
| Stock | the stores tracked, the number of nets per bale | the list of stores |
| Users | who uses which project, in which area | the list of agents |

Not everything decided yet? You can still test the campaign setup: the assistant can propose
demo data (demo pyramid, example districts, stores and agents) that you replace later with
your own.

Then the assistant builds the campaign step by step, asking for your go-ahead each time:
geographic data, projects, forms, registries, stock, users, dashboards and mobile reports.

You can install the IASO app as soon as the assistant shows the QR codes, but the phone shows
little until the rest exists:

| After | On the phone |
|---|---|
| the projects | the app can be set up with the project's QR code, but shows nothing yet |
| the forms and the users | an agent logs in, synchronises and sees the forms |
| the registries and their follow-ups | households and workers can be registered and found again |
| the stock | the stock forms; balances appear after a first receipt |
| the mobile reports | the report opens from the app |

The first useful test on a phone is therefore once the users exist, about two thirds into the
session.

### Step 6: Test on a phone

1. **Install the IASO app** on an Android phone from
   [Google Play](https://play.google.com/store/apps/details?id=com.bluesquarehub.iaso&hl=en)
   (or scan the Play Store QR code the assistant gives you).
2. **Choose the user to test with**: a test user created by the assistant, or your own
   user (the assistant offers to add you to the campaign projects). Either way, this user must have the projects you want to test: in IASO, go to
   **Admin > Users**, edit the user and, in **Projects**, select the projects to test. To try
   the different projects and switch from one to another, select all of them.
3. **Find the QR codes** in IASO: open the menu and go to **Admin > Projects**. Each mobile
   project of the campaign is listed there, with its QR code ready to scan.
4. **Open the IASO app** on the phone, choose to scan a QR code and scan the QR code of the
   project to test. Accept the permission requests that show up (camera, location…).
5. **Log in** with the user chosen in point 2.
6. Follow the test checklist the assistant gives you: register a household, find it again,
   distribute nets, register a worker, record a stock movement.
7. Open the mobile reports, with network and then in airplane mode.

![A project home screen on the phone](./setup_bednet_campaign_with_ai_attachments/phone-home.jpg){ width="220" }
![The progress report in the app](./setup_bednet_campaign_with_ai_attachments/phone-report.jpg){ width="220" }
![The map of households in the progress report](./setup_bednet_campaign_with_ai_attachments/mobile-report-map.jpg){ width="220" }

!!! note "Where are the stock forms?"
    On servers that have the stock home screen, the Stock project opens on the stores and their
    forms. Otherwise, the assistant adds a **Data collection** tab to the Stock project: open
    it, choose the store, and the stock forms are listed. Without that tab, the stock forms
    are under **Entities > Update stocks**, then the store, then **Edit** next to its name.

Before training the field teams, ask the assistant to delete the test data and the test
users.

### Step 7: After the setup

- To change something during the campaign (a question in a form, a new district, a report),
  simply ask the assistant: come back to it with the kit, which still contains your access
  key. Forms already used on phones must be changed with
  care: the kit tells the assistant how.
- Follow the campaign in the web dashboards (**Pages** menu in IASO) and in the mobile reports.
  The campaign dashboard and the progress report show the households on a map (base map from
  Bluesquare's tile server, from OpenStreetMap): in the dashboard, click a row of the table to
  zoom on that place.

![The campaign dashboard](./setup_bednet_campaign_with_ai_attachments/page-dashboard.jpg){ .doc-shot }

## Learn more

- The kit contains a detailed guide (`GUIDE.html`) with the campaign phase by phase and
  screenshots of every tool.
- [IASO concepts](../users/reference/iaso_concepts.md) and [IASO modules](../users/reference/iaso_modules.md)
- [IASO mobile app](../users/reference/iaso_mobile.md)
