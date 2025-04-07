const regexUuidV7 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export const validateUUIDv7 = (value: string): boolean => {
  return regexUuidV7.test(value);
};
