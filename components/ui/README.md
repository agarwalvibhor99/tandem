# Tandem UI components

Use `constants/theme.ts` for color, type, spacing, radius, border, and control-size values. Use `components/ui` for reusable presentation and `components/<feature>` for feature composition. Screens and feature components own data fetching and form state; primitives do not.

| Component | Variants / options | Use |
| --- | --- | --- |
| `Screen` | standalone, header action, refresh | Page shell, navigation, safe area, pull to refresh |
| `Text` | display, title, heading, body, label, caption, tab, money; tone | All app copy |
| `Button` | primary, secondary, quiet, danger; regular or compact size; loading, disabled | Explicit actions; use `onPress` on React Native |
| `CompactAction` | icon, description | Small feature creation action |
| `Surface` | style | Grouped card; use `DashboardCard` for dashboard content |
| `FormField` / `HeroTextField` | error, hint, multiline / hero | Form inputs; hero is reserved for the primary value |
| `ChoiceChips` / `IconTile` | selected, disabled | Short choices / visual category choices |
| `VisibilitySegment` | shared availability, labels | Personal or shared content; `VisibilitySelector` adds a label and hint |
| `PersonSelector` | anyone option, disabled | Choosing who is responsible |
| `GroupedPanel`, `GroupRow`, `GroupDivider` | icon, value, trailing | Settings and progressively revealed form options |
| `DatePicker` / `TimePicker` | trigger, clear / exact minute | Date and time choices; both use `Dialog` |
| `Dialog` | title | Accessible modal shell with the shared backdrop and panel |
| `EmptyState` | icon, action | Useful explanation and next step when a collection is empty |
| `LoadingState` | label | Page or collection loading; use an inline spinner inside a card |
| `ErrorState` | retry action | A recoverable page or collection error |
| `Notice` | error | Inline feedback; use a feature toast for transient confirmations |
| `CounterControl` | disabled | Small whole-number quantities |
| `Checkbox` | checked, loading | A 44px target for reversible completion |
| `ActionPanel` / `ActionRow` | title, description / children | Detail-screen actions and adjacent buttons |

Composed components live directly under `components/` or in a feature folder. `CheckableCard` and `CheckableCardMeta` give Tasks and Reminders one card layout while those features supply their own meaning and navigation.

Do not add hover-only tooltips: important help needs to work with touch and screen readers. Add a skeleton only when the final layout is stable enough to make one useful. Feature-specific status indicators belong beside their domain components.

## Duplication audit

- The task date calendar and the general date picker had separate month grids and modal shells. Tasks now use `DatePicker`; date and time pickers use `Dialog`.
- Lists, Tasks, Dates, Reminders, and Money repeated card, heading, description, and action markup for empty states. These now use `EmptyState`.
- Those collection screens repeated standalone progress indicators. These now use `LoadingState`; compact dashboard indicators remain inline because they represent individual card values.
- Recoverable collection errors now use `ErrorState`; contextual validation and mutation errors remain in `Notice`.
- `VisibilitySelector`, `VisibilitySegment`, and the expense form previously rendered different controls for the same personal/shared decision. They now share `VisibilitySegment` presentation.
- The expense payer choices and task assignee choices now use `PersonSelector`, with one label and selection pattern.
- `FormField`, `HeroTextField`, `ChoiceChips`, `IconTile`, `GroupedPanel`, and `Surface` were already shared and should be extended with props instead of copied.
- Task and reminder cards had identical container, title, metadata, and saving styles. Both now use `CheckableCard`. Lists, Tasks, and Reminders now use the same `Checkbox` target.

Feature-specific loading and error markup remains where the recovery action or the card content differs. Preserve calculated values such as chart bar widths as dynamic styles.
