import { EventForm } from '@/components/calendar/event-form';
import { Screen } from '@/components/ui/screen';
export default function NewEventScreen() { return <Screen standalone title="Add an event" description="Put a plan on your calendar. Decide what stays private."><EventForm /></Screen>; }
