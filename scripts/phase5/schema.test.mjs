import assert from "node:assert/strict";
import test from "node:test";
import {
  signInSchema,
  registerSchema,
  forgotPasswordSchema,
} from "../../src/features/auth/validation/auth.schemas.ts";
import { profileSetupSchema } from "../../src/features/onboarding/validation/profile.schema.ts";
import { authRoles } from "../../src/config/auth.ts";
const login = {
  email: "  AMA@CAMPUSONE.DEMO  ",
  password: " preview pass ",
  role: "student",
  remember: true,
};
const registration = {
  name: "  Kwame Mensah  ",
  email: login.email,
  password: "preview-123",
  confirmPassword: "preview-123",
  consent: true,
};
test("sign-in trims and normalizes email, not the password; every demo role is bounded", () => {
  const parsed = signInSchema.parse(login);
  assert.equal(parsed.email, "ama@campusone.demo");
  assert.equal(parsed.password, login.password);
  for (const role of authRoles) assert.equal(signInSchema.parse({ ...login, role }).role, role);
  for (const role of ["superadmin", "", null, 5])
    assert.equal(signInSchema.safeParse({ ...login, role }).success, false);
});
test("credential boundaries reject malformed/long emails and short/long passwords", () => {
  for (const email of ["", " ", "no-at-sign", `${"a".repeat(255)}@demo.test`])
    assert.equal(signInSchema.safeParse({ ...login, email }).success, false);
  for (const password of ["", "1234567", "a".repeat(129)])
    assert.equal(signInSchema.safeParse({ ...login, password }).success, false);
  for (const password of ["12345678", "a".repeat(128)])
    assert.equal(signInSchema.safeParse({ ...login, password }).success, true);
});
test("registration uses meaningful Unicode names, matching passwords and explicit preview acknowledgment", () => {
  assert.equal(registerSchema.parse(registration).name, "Kwame Mensah");
  assert.equal(registerSchema.safeParse({ ...registration, name: "Ési O'Kyerɛ" }).success, true);
  for (const name of [" ", "1", "1234", "a".repeat(81)])
    assert.equal(registerSchema.safeParse({ ...registration, name }).success, false);
  const mismatch = registerSchema.safeParse({ ...registration, confirmPassword: "not-matching" });
  assert.equal(mismatch.success, false);
  assert.ok(mismatch.error.issues.some((i) => i.path[0] === "confirmPassword"));
  assert.equal(registerSchema.safeParse({ ...registration, consent: false }).success, false);
});
test("reset and setup schemas normalize names/emails and bound programmes, levels and interests", () => {
  assert.equal(forgotPasswordSchema.parse({ email: login.email }).email, "ama@campusone.demo");
  const profile = {
    name: " Ama ",
    programme: "BSc Information Technology",
    level: "Level 300",
    interests: ["Clubs & societies"],
    portrait: "initials",
  };
  assert.equal(profileSetupSchema.parse(profile).name, "Ama");
  for (const change of [
    { programme: "Unknown programme" },
    { level: "900" },
    { portrait: "external" },
    { interests: ["Injected interest"] },
  ])
    assert.equal(profileSetupSchema.safeParse({ ...profile, ...change }).success, false);
});
