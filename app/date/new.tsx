import { DateIdeaForm } from '@/components/dates/date-idea-form';
import { Screen } from '@/components/ui/screen';
export default function NewDateIdeaScreen() {
  return <Screen standalone title="Save a date idea" description="Keep the good ideas you want to try together."><DateIdeaForm /></Screen>;
}
