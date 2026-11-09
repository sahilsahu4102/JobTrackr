---
name: JobTrackr
description: A job application board built from job-bag dockets pinned on a grey rail, printed in ink and filled in ballpoint blue.
colors:
  rail: "#d5d9dc"
  rail-deep: "#c3c9cf"
  docket: "#faf9f4"
  docket-sunk: "#efede4"
  entry: "#fefdfa"
  ink: "#1a1d21"
  ink-secondary: "#464c55"
  ink-muted: "#5d6470"
  hairline: "#bebbae"
  ballpoint-blue: "#1f4e9e"
  action-red: "#c23b22"
  action-red-deep: "#a92e17"
typography:
  display:
    fontFamily: "Sofia Sans Condensed, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 2.75rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "Sofia Sans Condensed, Arial Narrow, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Sofia Sans, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Sofia Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Sofia Sans Condensed, Arial Narrow, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.08em"
rounded:
  none: "0px"
spacing:
  docket-x: "12px"
  bay-gap: "16px"
  page-gutter: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.docket}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.ballpoint-blue}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "44px"
  field:
    backgroundColor: "{colors.entry}"
    textColor: "{colors.ballpoint-blue}"
    rounded: "{rounded.none}"
    padding: "0 12px"
    height: "44px"
  docket:
    backgroundColor: "{colors.docket}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
  score-box:
    backgroundColor: "{colors.docket}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "1px 7px"
  chip:
    backgroundColor: "{colors.docket}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "2px 10px"
---

# Design System: JobTrackr

## Overview

**Creative North Star: "The Job Bag"**

In a print shop a job travels in a bag with a docket slip: printed labels in black, the job's particulars filled in by hand, and the slip pinned in whichever stage the job has reached. JobTrackr treats every application the same way. The board is a rail of five stage bays; each application is a flat ruled docket hanging in one of them. The world was chosen by the project owner from a rolled hand and replaces the earlier dark violet glass dashboard completely.

The system is dense, flat and quiet. Printed text is ink, what was filled in is ballpoint blue, and red is rationed to the one thing that needs action today. Nothing glows, blurs, floats or casts a shadow; structure is rules and borders. State is a drawn mark plus a word or number, so the board survives greyscale.

**Key Characteristics:**
- A grey enamel rail, five stage bays, flat dockets ruled in 1px ink.
- Printed labels (condensed, uppercase, ink) against filled-in entries (blue).
- Match score is a boxed number whose border is the band: double, single or dashed.
- Red marks only a follow-up that is overdue or due within two days, and form errors.
- A rejected docket is stamped CLOSED and stays fully legible.
- Square corners everywhere; no gradients, glass, glow, orbs or sparkle icons.

## Colors

A cool grey rail, warm-white docket stock, carbon ink, one ballpoint blue and one red.

### Primary
- **Ballpoint Blue** (#1f4e9e): what was filled in (location, dates, typed entries), links, the primary button's hover fill and the focus ring. 7.5:1 on docket.

### Secondary
- **Action Red** (#c23b22): the top rule of a docket that needs action, the follow-up row's text, form errors. 5.0:1 on docket.
- **Action Red Deep** (#a92e17): the same signal as text on the grey rail, where the lighter red would fall under 4.5:1.

### Neutral
- **Rail** (#d5d9dc): the page ground behind the board.
- **Rail Deep** (#c3c9cf): the inside of each stage bay.
- **Docket** (#faf9f4): dockets, the app bar, panels, sheets.
- **Docket Sunk** (#efede4): hover rows, disabled controls, the AI fill box.
- **Entry** (#fefdfa): typing fields.
- **Ink** (#1a1d21): text, rules, primary button.
- **Ink Secondary** (#464c55): supporting text and printed labels (6.1:1 on rail).
- **Ink Muted** (#5d6470): placeholders and fine print on docket stock only.
- **Hairline** (#bebbae): row separators inside a docket, never an outer edge.

### Named Rules
**The Rationed Red Rule.** Red appears only where something needs attention. If everything is red, nothing is.

**The Printed-versus-Filled Rule.** Labels are printed (ink, condensed). Values the user typed or the AI extracted are filled in (ballpoint blue).

## Typography

**Display and label font:** Sofia Sans Condensed (with Arial Narrow, system-ui)
**Body font:** Sofia Sans (with system-ui)

**Character:** The condensed face reads like pre-printed form type and keeps five columns legible; the regular width carries entries and prose. Numerals are tabular.

### Hierarchy
- **Display** (700, clamp(2rem, 4vw, 2.75rem), 1): page titles and the sign-in headline (larger on that page).
- **Headline** (700, 1.1875rem): stage names, panel titles, buttons.
- **Title** (700, 1.0625rem, 1.25): the role on a docket.
- **Body** (400, 0.9375rem, 1.5): entries and notes.
- **Label** (600, 0.8125rem, 0.08em, uppercase): field labels and the printed rows on a docket.

### Named Rules
**The Measure Rule.** Prose never runs wider than about 62 characters.

## Layout

A page of up to 1480px with 32px gutters (16px under 720px). The board is a five-column grid of bays (minimum 236px each, 16px apart) that fits at 1440px with no sideways scroll; below that the board scrolls sideways inside its own region with snap points, never the page. The app bar is a ruled bar with the wordmark, three tabs and the actions; on a phone it wraps into rows. Sign-in is two halves on desktop (what the tool does, and the docket with the guest door first) and, on a phone, headline then the docket then the list, so the guest door is visible without scrolling.

## Elevation & Depth

Flat. There are no shadows, blurs or layers except the modal scrim, a flat 55% ink wash. Depth is expressed with rules: a docket is a bordered slip, a bay is a darker rail inset, a sheet is a bordered docket over the scrim.

### Named Rules
**The Ruled-Not-Raised Rule.** Separate with a rule, group with a border, never lift with a shadow.

## Shapes

Square corners (0px). Borders are 1px ink for dockets and chips, 1.5px for fields and outlined buttons, 2px for sheets and the app bar's bottom edge. The match score box carries its band in its border: 4px double (80 and up), 1.5px solid (60 to 79), 1.5px dashed (under 60). The CLOSED stamp is a 2px ink box.

## Components

### Buttons
- **Shape:** square, 44px high (52px large, 40px small), condensed bold label.
- **Primary:** ink fill, docket text; hover fills ballpoint blue.
- **Outline:** transparent with a 1.5px ink border; hover inverts. Danger is the same with a dashed border.
- **Ghost:** transparent; hover shows the docket-sunk fill and an ink border.

### Docket
A flat slip: role and score box at the head, company beneath, then ruled rows (Location, Applied, Follow up), a skills line, and a foot with the CLOSED stamp when rejected and a Details button. A docket that needs action gets a 5px red rule on top. The whole docket drags; Details is the keyboard route to the sheet.

### Inputs / Fields
- **Style:** entry fill, 1.5px ink border, blue text for what is typed.
- **Focus:** 2px blue outline. **Error:** dashed red border and red message.

### Navigation
- **Style:** condensed tabs in the app bar; the current tab has a 3px ink underline. The guest strip sits under the bar whenever the session is a guest.

### Stage Bay
A 3px ink top rule, the stage name, a boxed count, then a rail-deep inset holding the dockets. Dropping over a bay turns its border dashed.

### Sheet
The details and add-application dialogs: a bordered docket over the scrim with a 2px ink header rule and a ruled footer of actions.

## Do's and Don'ts

### Do:
- **Do** label sample data as sample, and say what the AI is (free models that can be slow or limited).
- **Do** give every slow or failing request a visible message and a way forward.
- **Do** carry state as a mark plus a word or number.
- **Do** keep red for action and errors only.

### Don't:
- **Don't** add gradients, glass, glow, blurred orbs, shadows or rounded corners.
- **Don't** use sparkle icons or the word AI as decoration; name what the feature does.
- **Don't** colour the stages or the match bands; the stage is the column and the band is the border.
- **Don't** invent users, metrics or accuracy figures.
