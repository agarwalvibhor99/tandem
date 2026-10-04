import { router } from 'expo-router';
import { ArrowUpRight, ListPlus, ShoppingBasket } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { CompactAction } from '@/components/ui/compact-action';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { colors, layout, radii, spacing } from '@/constants/theme';
import { useLists } from '@/hooks/use-lists';
import { useScreenFocus } from '@/hooks/use-screen-focus';
import type { SharedList } from '@/types/list';

function ListCard({ list }: { list: SharedList }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${list.name}, ${list.type} list`} onPress={() => router.push({ pathname: '/list/[id]', params: { id: list.id } })} style={styles.card}>
    <View style={styles.listIcon}><ShoppingBasket color={colors.accent} size={layout.iconSize} /></View>
    <View style={styles.copy}><Text variant="heading">{list.name}</Text><Text variant="caption" tone="secondary">{list.type} · Shared with your space</Text></View>
    <ArrowUpRight color={colors.accent} size={layout.iconSize} />
  </Pressable>;
}
export default function ListsScreen() {
  const focused = useScreenFocus();
  const { couple, query } = useLists(focused);
  return <Screen title="Lists" description="Everything you need, kept together." pageTitle="Lists">
    {couple.isPending && <ActivityIndicator color={colors.accent} accessibilityLabel="Loading shared space" />}
    {couple.isError && <><Notice error message="We couldn’t load your shared space." /><Button variant="secondary" label="Try again" onPress={() => void couple.refetch()} /></>}
    {couple.isSuccess && !couple.data && <Surface><ListPlus color={colors.accent} size={32} /><Text variant="heading">Lists are better together</Text><Text tone="secondary">Create a shared space to keep groceries, shopping and packing in one place.</Text><Button label="Connect your partner" onPress={() => router.push('/create-space')} /></Surface>}
    {couple.data && <>
      <CompactAction icon={ListPlus} label="New list" onPress={() => router.push('/list/new')} />
      {query.isPending && <ActivityIndicator color={colors.accent} accessibilityLabel="Loading lists" />}
      {query.isError && <><Notice error message="We couldn’t load your lists." /><Button variant="secondary" label="Try again" onPress={() => void query.refetch()} /></>}
      {query.isSuccess && query.data.length === 0 && <Surface><ShoppingBasket color={colors.accent} size={32} /><Text variant="heading">A place for the little things</Text><Text tone="secondary">Make a grocery list, plan what to pack, or keep a shopping list you can both add to.</Text><Button variant="quiet" label="Create your first list" onPress={() => router.push('/list/new')} /></Surface>}
      {query.data?.map((list) => <ListCard key={list.id} list={list} />)}
    </>}
  </Screen>;
}
const styles = StyleSheet.create({ card: { flexDirection: 'row', alignItems: 'center', minHeight: 88, gap: spacing.lg, padding: spacing.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg }, listIcon: { width: layout.minTouchTarget, height: layout.minTouchTarget, borderRadius: radii.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: spacing.xs } });
