/** Motion tokens: quick and quiet. Every animation also checks useReducedMotion(). */
export const motion = {
  fast: 160, // state feedback: toggles, segmented thumb
  base: 240, // element transitions
  slow: 420, // one-off reveals (chart bars)
} as const;
