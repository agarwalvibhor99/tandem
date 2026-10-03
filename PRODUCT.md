# Tandem — Product Specification

## Product Vision

Tandem is a shared life-management app for couples.

It is designed to become a **single operating system for two people managing life together**.

The app should reduce the amount of repetitive coordination couples have to do.

Examples:

- What are we doing tonight?
- When are we both free?
- Did you pay the bill?
- Can you get groceries?
- Who is doing this task?
- What do we need from the store?
- What should we do this weekend?
- Did we book the hotel?
- How much have we spent this month?
- What restaurants did we want to try?
- When is our anniversary?
- Who is busier this week?

The product is not simply:

- a to-do app
- a calendar
- an expense tracker
- a couples social network
- a grocery list

It combines these workflows into one cohesive product designed specifically for a two-person household.

---

# Core Product Principle

The app should answer:

**What do we need to do, where do we need to be, what are we spending, and when can we spend time together?**

Everything we build should support this principle.

---

# Users

The primary unit is a couple consisting of two users.

Each person retains an individual identity.

There are three conceptual ownership states throughout the product:

- Mine
- Partner's
- Ours

Do not assume everything is shared.

Privacy must be intentional.

---

# Privacy Philosophy

Sharing should be explicit rather than automatic.

Users may create:

- private personal content
- shared content
- content assigned to their partner

For calendars specifically:

A private calendar event must not expose its title or details to the partner.

The partner may only see:

**Busy**

This allows the app to calculate shared availability without compromising privacy.

Database security must enforce these rules.

Frontend hiding is not sufficient.

---

# Product Personality

The product should feel:

- warm
- calm
- premium
- human
- modern
- thoughtful
- lightweight
- trustworthy

It should NOT feel:

- corporate
- childish
- overly romantic
- overly pink
- gamified
- like project-management software
- like banking software
- like social media

Relationship context should come through subtly.

Do not cover every screen in hearts, romantic illustrations, gradients, or couple clichés.

Utility comes first.

---

# Design Direction

Think about the clarity and restraint of products such as:

- Airbnb
- Apple Reminders
- Notion Calendar
- Linear
- modern consumer fintech apps

But make it warmer and more personal.

Prefer:

- generous whitespace
- clear hierarchy
- rounded cards
- restrained accent color
- subtle motion
- high-quality typography
- intuitive icons
- contextual summaries

Avoid:

- excessive gradients
- excessive glassmorphism
- giant decorative illustrations
- dense dashboards
- tiny controls
- unnecessary charts

---

# Core MVP

The MVP consists of:

## 1. Today

The primary home screen.

This should summarize what matters today instead of forcing users to open every module.

Potential information:

- today's schedules
- common free time
- upcoming shared event
- today's tasks
- grocery items remaining
- spending summary
- reminders
- upcoming date plan
- useful contextual prompt

Example:

Today

Alex
Work until 5:30 PM

Sam
Busy until 6 PM

Together
Free 6:30–10:30 PM

3 tasks remaining

5 groceries remaining

Electricity bill tomorrow

$142 shared spending this week

Saved idea:
Ramen + waterfront walk

The Today experience is a defining product feature.

---

# 2. Calendar

Allow users to understand both schedules without exposing unnecessary private information.

Features:

- personal events
- shared events
- partner busy blocks
- day view
- week view
- simplified month view
- common free-time calculation

Filters:

- Mine
- Partner
- Together

The app should eventually answer:

**When are we both available?**

This is more important than being a full Google Calendar replacement.

---

# 3. Tasks

Tasks may be:

- personal
- shared
- assigned to one partner
- recurring

Users should understand ownership immediately.

Do not make tasks feel like Jira or Asana.

Primary filters:

- Today
- Upcoming
- Mine
- Partner
- Shared
- Completed

---

# 4. Lists

Lists support shared lightweight coordination.

Initial types:

- Groceries
- Shopping
- Packing
- Custom

Both partners should be able to edit shared lists in realtime.

The interaction must be extremely fast.

---

# 5. Money

Simple couple expense management.

Users can record:

- amount
- category
- paid by
- split
- notes

Support:

- 50/50
- custom amounts
- one person pays

Show:

- shared spending
- amount paid by each person
- current settlement balance

Do not turn MVP into personal financial management software.

Future functionality may include:

- budgets
- recurring bills
- subscriptions
- savings goals
- bank connectivity

---

# 6. Reminders

Support:

- private reminders
- shared reminders
- reminders assigned to partner
- basic recurrence

Examples:

Pay electricity

Take recycling out

Anniversary coming up

Buy birthday gift

Call leasing office

---

# 7. Dates / Things We Want To Do

Couples should maintain a shared backlog of experiences.

Examples:

- restaurants
- activities
- movies
- hikes
- trips
- at-home activities
- events

Statuses:

- Want to do
- Planned
- Done

This should eventually connect to availability and planning.

---

# Date Planning Vision

Eventually the user should be able to say:

**Plan our Friday night.**

The system should understand:

- both schedules
- free time
- saved date ideas
- budget
- location
- preferences
- weather
- travel time
- unfinished errands

Example output:

6:15 PM
Pick up groceries

7 PM
Dinner

8:30 PM
Waterfront walk

9:30 PM
Dessert

Initially this can use deterministic logic.

AI can be added later.

---

# Future Product Areas

Architecture should leave room for:

- meal planning
- recipes
- travel planning
- packing
- household inventory
- subscriptions
- savings goals
- pet care
- shared documents
- gift ideas
- birthdays
- anniversaries
- wishlists
- watchlists
- memories
- relationship milestones
- household chores
- family coordination
- polls and decisions
- AI assistant

Do not implement these until the core product works well.

---

# Navigation Philosophy

Primary mobile navigation should remain simple.

Initial recommendation:

- Today
- Calendar
- Tasks
- Lists
- More

More may contain:

- Money
- Dates
- Reminders
- Settings

Do not add a navigation tab for every feature.

---

# Global Create Action

The product should provide a fast global add action.

Potential actions:

- Task
- Event
- Expense
- Grocery item
- Reminder
- Date idea

Creating common items should require very few taps.

---

# Couple Model

Do not model the database using hardcoded fields such as:

user1_id
user2_id

Use:

User

Couple

CoupleMembership

This allows the architecture to remain maintainable.

For the MVP, enforce a maximum of two active members.

---

# Today as the Product Hub

The app should not become a collection of independent modules.

Features should feed into Today.

Examples:

Calendar → shared availability

Tasks → what needs attention today

Lists → remaining grocery count

Money → current spending

Reminders → upcoming important item

Dates → possible plan during shared free time

This integration is critical.

---

# Product Language

Avoid unnecessarily technical language.

Prefer:

Who's doing this?

instead of:

Assignee

Prefer:

Together

instead of:

Shared Resources

Prefer:

Paid by

instead of:

Expense Owner

Prefer:

Both of you

instead of:

All household members

The app should sound human.

---

# Empty States

Empty states should be useful.

Examples:

Tasks:
Nothing on your plate.

Dates:
Save places and things you'd love to try together.

Groceries:
Your list is empty.

Partner:
Connect your partner to start planning together.

An empty state should usually include an action.

---

# Notifications

Notifications must be meaningful.

Potential notification types:

- task assigned
- shared reminder due
- shared event coming up
- partner invite accepted
- important list update
- expense added

Do not notify users about every tiny interaction.

Avoid creating notification fatigue.

---

# Accessibility

Design for:

- adequate contrast
- readable typography
- clear touch targets
- screen readers
- non-color indicators
- dynamic text where practical

Accessibility is not an optional polish step.

---

# Offline Behavior

The MVP does not need to be fully offline-first.

However:

- cache relevant data
- show cached information when reasonable
- use optimistic updates for simple interactions
- gracefully recover from failures

---

# Product Success Test

A successful first version should allow this journey:

User A signs up.

User A connects User B.

User A creates a shared task.

User B immediately sees it.

They add groceries together.

They see each other's availability without exposing private calendar details.

They record a dinner expense.

They can see when both are free.

They save a restaurant they want to visit.

Their Today screen summarizes what matters.

At that point the application should already provide meaningful value.

---

# Guiding Question

Whenever considering a feature, ask:

**Does this reduce coordination friction between two people?**

If the answer is no, reconsider whether it belongs in the product.
