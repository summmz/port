/**
 * Shared swipe-lock — tiny module with zero deps to avoid circular imports.
 * Set `current = true` while a horizontal swipe gesture is in progress.
 * Both Hud.tsx (writer) and ProjectCard.tsx (reader) import from here.
 */
export const swipeLockRef = { current: false }
