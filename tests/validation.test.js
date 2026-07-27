import { isStrongPassword, isValidEmail } from "../utils/validation";

describe("form validation", () => {
  test.each([
    "usuario@example.com",
    "first.last+tag@example.co",
    "  usuario@example.com  ",
  ])("accepts valid email %s", (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  test.each([undefined, "", "usuario", "@example.com", "a@b"])(
    "rejects invalid email %p",
    (email) => {
      expect(isValidEmail(email)).toBe(false);
    },
  );

  test("accepts the password policy used by registration", () => {
    expect(isStrongPassword("Password1!")).toBe(true);
  });

  test.each([
    undefined,
    "short1!",
    "password1!",
    "PASSWORD1!",
    "Password!",
    "Password1",
  ])("rejects weak password %p", (password) => {
    expect(isStrongPassword(password)).toBe(false);
  });
});
