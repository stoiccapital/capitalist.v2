// Physical constants. Pure numbers only — no THREE, no positions, no coupling to a city.
// Anything city-shaped (HOUSE, TOWER, PAD coordinates) lives in content/cities/*.js.

export const SIZE = 2400, SEG = 320;
export const PLATEAU_R = 550, PLATEAU_H = 12, WATER_H = 0;
export const PAD_R = 72, PAD_H = 45;

// Amenity reach: full lift within NEAR, fades to nothing past FAR.
export const NEAR = 100, FAR = 250;

// Plateau top surface (y where buildings sit on the city plateau).
export const Y0g = PLATEAU_H + 0.12;
