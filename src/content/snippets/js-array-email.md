---
title: "Checking an email address before saving images to it"
from: "JS Array"
language: js
skill: "Form validation"
file: "js/main.js"
order: 1
---

```js
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const emailValidationRules = {
  minLength: 5,
  maxLength: 254,
};

// The problem with an email, or null when it's fine
function validateEmail(email) {
  if (!email || email.length < emailValidationRules.minLength ||
      email.length > emailValidationRules.maxLength) {
    return "Email must be between 5 and 254 characters";
  }

  if (!emailPattern.test(email)) {
    return "Please enter a valid email address";
  }

  return null;
}

emailForm.addEventListener('submit', function (event) {
  event.preventDefault();
  const email = emailInput.value.trim();
  const validationError = validateEmail(email);

  if (validationError) {
    showToast(validationError, true);
    return;
  }

  attachImageToEmail(email, images[currentIndex]);
});
```

**The problem:** The app fetches random photos and lets you save the ones you like against an email address, so the address has to be checked before anything is stored under it.

**Why this approach:** Two cheap checks catch nearly every typo: a length limit (254 characters is the longest address the standards allow) and a pattern that needs something before the `@`, a domain and a dot. The checks live in one function that returns a message, so the form decides how to show it.

**What to notice:** `validateEmail` returns the reason it failed rather than `true` or `false`, so the toast can tell you exactly what to fix.
