// Shared mode state: which sheet is open, which plot is being previewed, and the reset flag.
// Kept as module-scoped getters/setters so game/world/ui can all read and mutate consistently.

export let mode = null;
export let preview = null;
export let confirmReset = false;
// Which district the Shop/Build/My-stuff lists are filtered to. Starts at D4 (central landmarks).
export let currentDistrict = 'D4';

export const setMode  = v => { mode = v; };
export const setPreview = v => { preview = v; };
export const setConfirmReset = v => { confirmReset = v; };
export const setCurrentDistrict = v => { currentDistrict = v; };
