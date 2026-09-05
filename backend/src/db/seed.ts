import { db } from "./client";
import { portals, portalFieldMappings } from "./schema";

/**
 * Seeds exactly two mock government portals and their canonical->portal
 * field mappings, if they don't already exist. Safe to call on every
 * server startup - it's a no-op once seeded.
 *
 * These are fictional demo portals for the SIH prototype only.
 */
export function seedPortalsAndMappings(): void {
  const existingCount = db.select().from(portals).all().length;
  if (existingCount > 0) return;

  const now = new Date().toISOString();

  const scholarship = db
    .insert(portals)
    .values({
      name: "Scholarship Application Portal",
      code: "SCHOLARSHIP",
      description: "Fictional demo portal for scholarship applications.",
      active: true,
      createdAt: now,
    })
    .returning()
    .get();

  const employment = db
    .insert(portals)
    .values({
      name: "Employment Application Portal",
      code: "EMPLOYMENT",
      description: "Fictional demo portal for employment applications.",
      active: true,
      createdAt: now,
    })
    .returning()
    .get();

  // Portal A ("Scholarship") and Portal B ("Employment") intentionally
  // use different field names for the exact same canonical OTR data,
  // to demonstrate interoperability.
  const scholarshipMappings = [
    { otrField: "fullName", portalField: "applicantName" },
    { otrField: "dateOfBirth", portalField: "dob" },
    { otrField: "mobileNumber", portalField: "phone" },
    { otrField: "email", portalField: "emailAddress" },
    { otrField: "address", portalField: "residentialAddress" },
    { otrField: "educationRecords", portalField: "educationHistory" },
    { otrField: "credentials", portalField: "academicCredentials" },
  ];

  const employmentMappings = [
    { otrField: "fullName", portalField: "candidateName" },
    { otrField: "dateOfBirth", portalField: "birthDate" },
    { otrField: "mobileNumber", portalField: "contactNumber" },
    { otrField: "email", portalField: "emailId" },
    { otrField: "address", portalField: "currentAddress" },
    { otrField: "educationRecords", portalField: "qualifications" },
    { otrField: "credentials", portalField: "certifications" },
  ];

  db.insert(portalFieldMappings)
    .values(scholarshipMappings.map((m) => ({ ...m, portalId: scholarship.id })))
    .run();

  db.insert(portalFieldMappings)
    .values(employmentMappings.map((m) => ({ ...m, portalId: employment.id })))
    .run();

  // eslint-disable-next-line no-console
  console.log("[otr-india-backend] seeded mock portals: Scholarship, Employment");
}
