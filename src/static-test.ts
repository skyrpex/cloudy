/**
 * Allows writing code that will be removed after tree-shaking.
 *
 * Useful to test types.
 *
 * @__NO_SIDE_EFFECTS__
 */
export function staticTest(callback: (...values: any[]) => any) {
  // Do nothing.
}
