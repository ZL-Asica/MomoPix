export interface CursorNavigationStart {
  cursor: string | null
  pageIndex: number
}

/**
 * Returns the closest known cursor at or before a requested page.
 *
 * The caller fetches forward from this point only when a deep link targets a
 * page that has not been visited in the current view.
 */
export function getCursorNavigationStart(
  cursorByPage: ReadonlyMap<number, string | null>,
  targetPageIndex: number,
): CursorNavigationStart {
  const exactCursor = cursorByPage.get(targetPageIndex)
  if (exactCursor !== undefined) {
    return { cursor: exactCursor, pageIndex: targetPageIndex }
  }

  let pageIndex = 0
  for (const knownPageIndex of cursorByPage.keys()) {
    if (knownPageIndex < targetPageIndex && knownPageIndex > pageIndex) {
      pageIndex = knownPageIndex
    }
  }

  return {
    cursor: cursorByPage.get(pageIndex) ?? null,
    pageIndex,
  }
}
