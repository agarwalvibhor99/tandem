import { ChoiceChips } from '@/components/ui/choice-chips';

type Person = { user_id: string; name: string };
export function PersonSelector({ label, value, onChange, people, userId, allowAnyone = false, disabled }: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  people: Person[];
  userId: string;
  allowAnyone?: boolean;
  disabled?: boolean;
}) {
  return <ChoiceChips label={label} value={value ?? ''} options={[
    ...(allowAnyone ? [{ value: '', label: 'Anyone' }] : []),
    ...people.map((person) => ({ value: person.user_id, label: person.user_id === userId ? 'You' : person.name })),
  ]} onChange={(next) => onChange(next || null)} disabled={disabled} />;
}
