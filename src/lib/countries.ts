/**
 * Countries + the government ID types accepted for each, used to drive the
 * KYC step of the listing wizard. Every country accepts a passport; most also
 * accept a national ID and/or driving license as a secondary option — this
 * mirrors how most manual KYC review teams actually operate.
 */
export type IdType = {
  value: string;
  label: string;
};

export type Country = {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  idTypes: IdType[];
};

const PASSPORT: IdType = { value: "PASSPORT", label: "Passport" };
const DRIVING_LICENSE: IdType = {
  value: "DRIVING_LICENSE",
  label: "Driving license",
};

export const COUNTRIES: Country[] = [
  {
    code: "US",
    name: "United States",
    idTypes: [
      PASSPORT,
      DRIVING_LICENSE,
      { value: "STATE_ID", label: "State-issued ID" },
      { value: "SSN_CARD", label: "Social Security card" },
    ],
  },
  {
    code: "GB",
    name: "United Kingdom",
    idTypes: [
      PASSPORT,
      DRIVING_LICENSE,
      { value: "NATIONAL_ID", label: "National ID card" },
    ],
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    idTypes: [
      PASSPORT,
      { value: "EMIRATES_ID", label: "Emirates ID" },
      DRIVING_LICENSE,
    ],
  },
  {
    code: "IT",
    name: "Italy",
    idTypes: [
      PASSPORT,
      { value: "CARTA_IDENTITA", label: "Carta d'identità (national ID)" },
      DRIVING_LICENSE,
    ],
  },
  {
    code: "FR",
    name: "France",
    idTypes: [
      PASSPORT,
      { value: "CNI", label: "Carte Nationale d'Identité" },
      DRIVING_LICENSE,
    ],
  },
  {
    code: "ID",
    name: "Indonesia",
    idTypes: [
      PASSPORT,
      { value: "KTP", label: "KTP (national ID)" },
      DRIVING_LICENSE,
    ],
  },
  {
    code: "JP",
    name: "Japan",
    idTypes: [
      PASSPORT,
      { value: "MY_NUMBER_CARD", label: "My Number Card" },
      DRIVING_LICENSE,
    ],
  },
  {
    code: "IN",
    name: "India",
    idTypes: [
      PASSPORT,
      { value: "AADHAAR", label: "Aadhaar" },
      { value: "PAN", label: "PAN card" },
      DRIVING_LICENSE,
    ],
  },
  {
    code: "CA",
    name: "Canada",
    idTypes: [
      PASSPORT,
      DRIVING_LICENSE,
      { value: "PROVINCIAL_ID", label: "Provincial ID card" },
    ],
  },
  {
    code: "AU",
    name: "Australia",
    idTypes: [
      PASSPORT,
      DRIVING_LICENSE,
      { value: "MEDICARE_CARD", label: "Medicare card" },
    ],
  },
  {
    code: "DE",
    name: "Germany",
    idTypes: [
      PASSPORT,
      { value: "PERSONALAUSWEIS", label: "Personalausweis (national ID)" },
      DRIVING_LICENSE,
    ],
  },
  {
    code: "SG",
    name: "Singapore",
    idTypes: [
      PASSPORT,
      { value: "NRIC", label: "NRIC" },
      DRIVING_LICENSE,
    ],
  },
  {
    code: "OTHER",
    name: "Other",
    idTypes: [PASSPORT, DRIVING_LICENSE, { value: "NATIONAL_ID", label: "National ID" }],
  },
];

export function idTypesForCountry(countryCode: string): IdType[] {
  return (
    COUNTRIES.find((c) => c.code === countryCode)?.idTypes ??
    COUNTRIES.find((c) => c.code === "OTHER")!.idTypes
  );
}
