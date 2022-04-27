declare const tag: unique symbol;

interface Tagged<Tag> {
  readonly [tag]: Tag;
}

/**
 * Creates an opaque type, which hides its internal details from the public, and can only be created by being used explicitly.
 *
 * @example
 * ```ts
 * type AccountId = OpaqueType<number, { readonly t: unique symbol }>;
 * type PersonId = OpaqueType<number, { readonly t: unique symbol }>;
 *
 * const createPersonId = () => 1 as PersonId;
 *
 * // This will fail to compile, as they are fundamentally different types.
 * const accountId: AccountId = createPersonId();
 * ```
 */
export type OpaqueType<Type, Tag = unknown> = Type & Tagged<Tag>;
