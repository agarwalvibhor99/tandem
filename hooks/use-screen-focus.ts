import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
/** Tab screens stay mounted; only visible screens should drive active fetching. */
export function useScreenFocus() {
  const [focused, setFocused] = useState(false);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  return focused;
}
