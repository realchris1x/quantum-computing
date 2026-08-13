// ─────────────────────────────────────────────────────────────
// Bloch Sphere State Math
// ─────────────────────────────────────────────────────────────

export interface BlochVector {
  x: number;
  y: number;
  z: number;
  theta: number;  // polar angle (0 = |0⟩, π = |1⟩)
  phi: number;    // azimuthal angle
}

export interface QubitState {
  alpha: [number, number]; // [real, imag] of |0⟩ amplitude
  beta:  [number, number]; // [real, imag] of |1⟩ amplitude
  label: string;
}

export const STATE_ZERO: QubitState = {
  alpha: [1, 0],
  beta:  [0, 0],
  label: '|0⟩',
};

export const STATE_ONE: QubitState = {
  alpha: [0, 0],
  beta:  [1, 0],
  label: '|1⟩',
};

export const STATE_PLUS: QubitState = {
  alpha: [1 / Math.SQRT2, 0],
  beta:  [1 / Math.SQRT2, 0],
  label: '|+⟩',
};

// Compute Bloch vector from qubit state
export function stateToBloch(state: QubitState): BlochVector {
  const [ar, ai] = state.alpha;
  const [br, bi] = state.beta;

  // x = 2(Re(α*β))  y = 2(Im(α*β))  z = |α|²-|β|²
  const x = 2 * (ar * br + ai * bi);
  const y = 2 * (ar * bi - ai * br);  // note sign convention
  const z = (ar * ar + ai * ai) - (br * br + bi * bi);

  const theta = Math.acos(Math.max(-1, Math.min(1, z)));
  const phi   = Math.atan2(y, x);

  return { x, y, z, theta, phi };
}

// Apply X gate (π rotation around X-axis)
export function applyX(state: QubitState): QubitState {
  return {
    alpha: state.beta,
    beta:  state.alpha,
    label: state === STATE_ZERO ? '|1⟩' : state === STATE_ONE ? '|0⟩' : 'X|ψ⟩',
  };
}

// Apply H gate (Hadamard)
export function applyH(state: QubitState): QubitState {
  const [ar, ai] = state.alpha;
  const [br, bi] = state.beta;
  const s = 1 / Math.SQRT2;
  return {
    alpha: [s * (ar + br), s * (ai + bi)],
    beta:  [s * (ar - br), s * (ai - bi)],
    label: 'H|ψ⟩',
  };
}

// Probability of measuring |0⟩ and |1⟩
export function probabilities(state: QubitState): { p0: number; p1: number } {
  const [ar, ai] = state.alpha;
  const [br, bi] = state.beta;
  return {
    p0: ar * ar + ai * ai,
    p1: br * br + bi * bi,
  };
}

// Interpolate between two Bloch vectors for animation
export function lerpBloch(a: BlochVector, b: BlochVector, t: number): BlochVector {
  const lerp = (x: number, y: number) => x + (y - x) * t;
  // Interpolate in Cartesian space and renormalize
  const x = lerp(a.x, b.x);
  const y = lerp(a.y, b.y);
  const z = lerp(a.z, b.z);
  const r = Math.sqrt(x * x + y * y + z * z) || 1;
  const nx = x / r, ny = y / r, nz = z / r;
  return {
    x: nx, y: ny, z: nz,
    theta: Math.acos(Math.max(-1, Math.min(1, nz))),
    phi:   Math.atan2(ny, nx),
  };
}

// Rotation matrix Rx(theta) applied to state
export function applyRx(state: QubitState, theta: number): QubitState {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);
  const [ar, ai] = state.alpha;
  const [br, bi] = state.beta;
  return {
    alpha: [cos * ar + sin * bi, cos * ai - sin * br],
    beta:  [cos * br + sin * ai, cos * bi - sin * ar],
    label: `Rx(${(theta * 180 / Math.PI).toFixed(0)}°)|ψ⟩`,
  };
}
