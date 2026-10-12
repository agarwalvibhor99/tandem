import { EventForm } from '@/components/calendar/event-form';
import { Screen } from '@/components/ui/screen';
export default function NewEventScreen() { return <Screen standalone title="Add an event" description="Choose the time, then decide what your partner sees."><EventForm /></Screen>; }
