import assert from "node:assert/strict";

const BOOTSTRAP_ADMIN_EMAIL = "mangohk@gmail.com";

function isBootstrapAdmin(email) {
  return email.trim().toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
}

function resolveRole(email, storedRole) {
  if (isBootstrapAdmin(email)) return "admin";
  if (storedRole === "student" || storedRole === "teacher" || storedRole === "admin") {
    return storedRole;
  }
  return null;
}

const DEFAULT = {
  pageThreshold: 30,
  pointsZhLow: 10,
  pointsZhHigh: 30,
  pointsEnLow: 30,
  pointsEnHigh: 50,
};

function calculatePoints(language, pageCount, settings = DEFAULT) {
  const isLow = pageCount <= settings.pageThreshold;
  if (language === "zh") return isLow ? settings.pointsZhLow : settings.pointsZhHigh;
  return isLow ? settings.pointsEnLow : settings.pointsEnHigh;
}

assert.equal(BOOTSTRAP_ADMIN_EMAIL, "mangohk@gmail.com");
assert.equal(isBootstrapAdmin("mangohk@gmail.com"), true);
assert.equal(isBootstrapAdmin("MangoHK@gmail.com"), true);
assert.equal(isBootstrapAdmin("other@example.com"), false);
assert.equal(resolveRole("mangohk@gmail.com", "student"), "admin");
assert.equal(resolveRole("teacher@school.edu", "teacher"), "teacher");
assert.equal(resolveRole("new@school.edu", null), null);
assert.equal(calculatePoints("zh", 30), 10);
assert.equal(calculatePoints("zh", 31), 30);
assert.equal(calculatePoints("en", 10), 30);
assert.equal(calculatePoints("en", 100), 50);

console.log("ok: roles + scoring smoke tests passed");
