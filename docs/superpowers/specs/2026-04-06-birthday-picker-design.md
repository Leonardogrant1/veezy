# Birthday Picker — Design Spec
Date: 2026-04-06

## Summary

Replace the manual age number input in Settings with a birthday date picker. The birthday is stored permanently; the age is always calculated on-the-fly from it.

## Data Model

- Add `birthday: string | null` to `UserData` (ISO format, e.g. `"1998-06-15"`).
- Remove `age` as a stored/settable field. It becomes a derived value: `new Date().getFullYear() - new Date(birthday).getFullYear()` (adjusted for whether the birthday has passed this year).
- `updateSettings` patch type: add `birthday`, remove `age`.
- Default value for `birthday`: `null`.

## Settings Screen (`app/app/settings.tsx`)

- The "Alter" row is renamed to **"Geburtstag"**.
- Displayed value: calculated age as a number (e.g. `"27"`), or `—` if `birthday` is null.
- `editField` state type changes from `'name' | 'age' | null` to `'name' | 'birthday' | null`.
- Tapping "Geburtstag" sets `editField = 'birthday'`, opening the new `BirthdayPickerModal`.
- The existing `EditFieldModal` for `age` is removed.

## BirthdayPickerModal (`app/components/modals/BirthdayPickerModal.tsx`)

New dedicated component, separate from `EditFieldModal`.

**Props:**
```ts
type Props = {
  visible: boolean;
  value: string | null;       // ISO date string or null
  onSave: (iso: string) => void;
  onClose: () => void;
};
```

**Behaviour:**
- Same bottom sheet style as `EditFieldModal`: backdrop fade-in, slide-up animation, handle bar, title, save button.
- Title: `"Geburtstag"`
- Contains `DateTimePicker` from `@react-native-community/datetimepicker`:
  - `mode="date"`
  - `display="default"` (iOS: inline wheel, Android: native calendar dialog)
  - `maximumDate={new Date()}` (no future dates)
  - `locale="de-DE"`
  - Initial value: parsed from `value` prop if set, otherwise 30 years ago as a sensible default.
- "Speichern" button saves the selected date as ISO string (`date.toISOString().split('T')[0]`).

## UserDataStore (`app/stores/UserDataStore.ts`)

- Add `birthday: null` to initial state.
- Add `birthday` to `updateSettings` patch type.
- Remove `age` from patch type (age is no longer set directly).
- Add a `getAge()` selector or inline calculation wherever age is needed.

## Age Calculation Helper

A small utility function (inline or in a utils file):

```ts
function calculateAge(birthday: string): number {
  const birth = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
```

## Package

Install via Expo: `npx expo install @react-native-community/datetimepicker`

## Out of Scope

- Migration of existing stored `age` values (field simply becomes unused/ignored).
- Showing the birthday date string itself in Settings (only the calculated age is shown).
