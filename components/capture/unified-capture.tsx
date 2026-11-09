import { format } from 'date-fns';
import { router } from 'expo-router';
import { Bell, CalendarDays, CheckSquare2, ShoppingBasket, Sparkles, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import { HeroTextField } from '@/components/ui/hero-text-field';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { borders, colors, layout, radii, spacing } from '@/constants/theme';
import { chooseCaptureKind, classifyCapture } from '@/lib/capture/classify';
import { classifyCaptureRemotely, isCaptureAiEnabled } from '@/lib/capture/remote';
import { captureKinds, type CaptureKind, type CaptureSuggestion } from '@/types/capture';

const labels: Record<CaptureKind, string> = { task: 'Task', grocery: 'Grocery', expense: 'Expense', event: 'Plan', reminder: 'Reminder' };
const icons = { task: CheckSquare2, grocery: ShoppingBasket, expense: Wallet, event: CalendarDays, reminder: Bell };
const examples = ['Milk for the grocery list', 'Dentist tomorrow at 3 PM', 'Spent $24 on lunch'];

function routeToReview(suggestion: CaptureSuggestion) {
  const common = { title: suggestion.title, source: 'capture' };
  if (suggestion.kind === 'task') router.push({ pathname: '/task/new', params: { ...common, ...(suggestion.scheduledAt ? { dueAt: suggestion.scheduledAt } : {}) } });
  if (suggestion.kind === 'event') router.push({ pathname: '/event/new', params: { ...common, ...(suggestion.scheduledAt ? { startAt: suggestion.scheduledAt } : {}) } });
  if (suggestion.kind === 'expense') router.push({ pathname: '/expense/new', params: { ...common, ...(suggestion.amount ? { amount: suggestion.amount } : {}) } });
  if (suggestion.kind === 'reminder') router.push({ pathname: '/reminder/new', params: { ...common, ...(suggestion.scheduledAt ? { remindAt: suggestion.scheduledAt } : {}) } });
  if (suggestion.kind === 'grocery') router.push({ pathname: '/lists', params: { capture: suggestion.title } });
}

export function UnifiedCapture({ onAction }: { onAction: () => void }) {
  const [input, setInput] = useState('');
  const [suggestion, setSuggestion] = useState<CaptureSuggestion | null>(null);
  const [interpreting, setInterpreting] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const interpret = async (value = input) => {
    if (!value.trim()) return;
    const local = classifyCapture(value);
    setSuggestion(local);
    setFallbackMessage(null);
    if (local.confidence === 'high' || !isCaptureAiEnabled()) return;
    setInterpreting(true);
    const remote = await classifyCaptureRemotely(value);
    setInterpreting(false);
    if (remote) setSuggestion(remote);
    else setFallbackMessage('Tandem used its offline interpretation. You can change the type below.');
  };
  const review = () => { if (!suggestion) return; onAction(); routeToReview(suggestion); };
  const Icon = suggestion ? icons[suggestion.kind] : Sparkles;
  return <View style={styles.container}>
    <View style={styles.hero}>
      <HeroTextField accessibilityLabel="Tell Tandem what you need" placeholder="e.g. Dinner Friday at 7 PM" value={input} onChangeText={(value) => { setInput(value); setSuggestion(null); }} maxLength={300} autoCapitalize="sentences" returnKeyType="done" onSubmitEditing={() => void interpret()} autoFocus />
      {!suggestion && <View style={styles.examples}>{examples.map((example) => <PressableScale key={example} accessibilityRole="button" accessibilityLabel={`Use example: ${example}`} onPress={() => { setInput(example); void interpret(example); }} style={styles.example}><Text variant="caption" tone="secondary">{example}</Text></PressableScale>)}</View>}
    </View>
    {!suggestion ? <Button label={interpreting ? 'Understanding…' : 'Continue'} size="large" loading={interpreting} disabled={!input.trim()} onPress={() => void interpret()} /> : <>
      <Surface variant="inset" style={styles.preview} accessibilityLiveRegion="polite">
        <View style={styles.previewHeader}><View style={styles.icon}><Icon color={colors.accent} size={layout.iconSize} /></View><View style={styles.previewCopy}><Text variant="caption" tone="secondary">Tandem understood</Text><Text variant="heading">{suggestion.title}</Text></View></View>
        <View style={styles.meta}><Text variant="caption" tone="secondary">{labels[suggestion.kind]}</Text>{suggestion.amount && <Text variant="caption" tone="secondary">${suggestion.amount}</Text>}{suggestion.scheduledAt && <Text variant="caption" tone="secondary">{format(new Date(suggestion.scheduledAt), 'EEE, MMM d · h:mm a')}</Text>}</View>
        <Text variant="caption" tone="secondary">{suggestion.rationale}</Text>
        {interpreting && <Text variant="caption" tone="secondary">Checking a more conversational interpretation…</Text>}
        {fallbackMessage && <Text variant="caption" tone="secondary">{fallbackMessage}</Text>}
      </Surface>
      <ChoiceChips label="Change type" value={suggestion.kind} options={captureKinds.map((kind) => ({ value: kind, label: labels[kind] }))} onChange={(kind) => setSuggestion(chooseCaptureKind(suggestion, kind))} compact />
      <Button label={`Review ${labels[suggestion.kind].toLowerCase()}`} size="large" disabled={interpreting} onPress={review} />
      <Button label="Start over" variant="quiet" disabled={interpreting} onPress={() => { setInput(''); setSuggestion(null); setFallbackMessage(null); }} />
    </>}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg }, hero: { gap: spacing.md }, examples: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  example: { minHeight: layout.smallControlHeight, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radii.pill, backgroundColor: colors.chip, borderWidth: borders.thin, borderColor: colors.border },
  preview: { gap: spacing.sm }, previewHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, previewCopy: { flex: 1, gap: spacing.xs },
  icon: { width: layout.minTouchTarget, height: layout.minTouchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.accentSoft },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
