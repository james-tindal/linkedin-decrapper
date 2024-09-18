
export const omit = <T extends object, const OmitKey extends keyof T>(obj: T, ...omitKeys: OmitKey[]) => {
  const newObj = {}
  for (const key of Object.keys(obj))
    // @ts-expect-error
    if (!omitKeys.includes(key))
      newObj[key] = obj[key]
  return newObj as Simplify<Omit<T, typeof omitKeys[number]>>
}

export type Simplify<T> = {[KeyType in keyof T]: T[KeyType]} & {}
