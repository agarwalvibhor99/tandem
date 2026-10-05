import { router } from 'expo-router';
import { ArrowUpRight, ListPlus, ShoppingBasket } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { CompactAction } from '@/components/ui/compact-action';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { borders, colors, layout, radii, spacing } from '@/constants/theme';
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
  const refreshing = couple.isFetching || query.isFetching;
  const refresh = () => { void couple.refetch(); void query.refetch(); };
  return <Screen title="Lists" description="Everything you need, kept together." pageTitle="Lists" refreshing={refreshing} onRefresh={refresh}>
    {couple.isPending && <LoadingState label="Loading shared space" />}
    {couple.isError && <ErrorState message="We couldn’t load your shared space." onRetry={() => void couple.refetch()} />}
    {couple.isSuccess && !couple.data && <EmptyState icon={<ListPlus color={colors.accent} size={layout.featureIconSize} />} title="Lists are better together" description="Create a shared space to keep groceries, shopping and packing in one place." action={{ label: 'Connect your partner', onPress: () => router.push('/create-space') }} />}
    {couple.data && <>
      <CompactAction icon={ListPlus} label="New list" onPress={() => router.push('/list/new')} />
      {query.isPending && <LoadingState label="Loading lists" />}
      {query.isError && <ErrorState message="We couldn’t load your lists." onRetry={() => void query.refetch()} />}
      {query.isSuccess && query.data.length === 0 && <EmptyState icon={<ShoppingBasket color={colors.accent} size={layout.featureIconSize} />} title="A place for the little things" description="Make a grocery list, plan what to pack, or keep a shopping list you can both add to." action={{ label: 'Create your first list', onPress: () => router.push('/list/new') }} />}
      {query.data?.map((list) => <ListCard key={list.id} list={list} />)}
    </>}
  </Screen>;
}
const styles = StyleSheet.create({ card: { flexDirection: 'row', alignItems: 'center', minHeight: layout.dashboardRowHeight, gap: spacing.lg, padding: spacing.lg, backgroundColor: colors.surface, borderWidth: borders.thin, borderColor: colors.border, borderRadius: radii.lg }, listIcon: { width: layout.minTouchTarget, height: layout.minTouchTarget, borderRadius: radii.md, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: spacing.xs } });
