export const listTypes = ['Groceries', 'Shopping', 'Packing', 'Custom'] as const;
export type ListType = typeof listTypes[number];
export const groceryCategories = ['Produce', 'Dairy', 'Meat', 'Frozen', 'Pantry', 'Snacks', 'Household', 'Other'] as const;
export type GroceryCategory = typeof groceryCategories[number];
export type SharedList = { id: string; couple_id: string; created_by: string; name: string; type: ListType; created_at: string; updated_at: string };
export type ListItem = { id: string; list_id: string; created_by: string; name: string; quantity: string | null; category: GroceryCategory | null; notes: string; completed: boolean; completed_by: string | null; created_at: string; updated_at: string };
export type ListInput = Pick<SharedList, 'couple_id' | 'name' | 'type'>;
export type ListItemInput = Pick<ListItem, 'list_id' | 'name' | 'quantity' | 'category' | 'notes'>;
