import { EventForm } from '@/components/calendar/event-form';
import { Screen } from '@/components/ui/screen';
export default function NewEventScreen() { return <Screen standalone title="Add an event" description="Set a time and choose who sees it."><EventForm /></Screen>; }
