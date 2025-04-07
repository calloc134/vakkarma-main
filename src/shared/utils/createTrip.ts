import crypto from "crypto";

export const createTrip = (tripKey: string): string => {
  const crypted = crypto
    .createHash("sha256")
    .update(tripKey)
    .digest("base64")
    .slice(0, 12);
  const trip = crypted.replace(/\+/g, ".").replace(/\//g, "$");

  return trip;
};
