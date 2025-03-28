// Nominal type helper
export type Nominal<T, Name extends string> = T & { readonly _type: Name };
