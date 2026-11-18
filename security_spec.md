# Security Specification — Педкеңес 4.0

## 1. Data Invariants
1. A response in `/surveys/{surveyId}/responses/{responseId}` cannot exist unless its parent `/surveys/{surveyId}` exists, `isOpen == true`, and `incoming().round == parent.activeRound`.
2. In `survey_1`, participants may select 1 or 2 valid options only (`selectedOptions.size() >= 1 && selectedOptions.size() <= 2`), never 3 or more.
3. In `case_1`, `case_2`, and `freshman_poll`, participants must select exactly 1 valid option (`selectedOptions.size() == 1`).
4. In `case_3`, participants must submit a complete 4-element permutation of `['step_1', 'step_2', 'step_3', 'step_4']`.
5. Responses are immutable (`allow update: if false`), and can only be deleted when `existing().round < parent.activeRound` (after an authorized admin reset increments `activeRound`).
6. `/admin_config/auth` and `/admin_sessions/{sessionId}` are strictly unreadable (`allow read: if false`) so password hashes and session tokens can never be scraped by clients.
7. Creating an `/admin_sessions/{sessionId}` requires `incoming().passwordHash == get(/databases/$(database)/documents/admin_config/auth).data.passwordHash`.
8. Updating `/surveys/{surveyId}` or `/council_settings/main` or `/admin_config/auth` requires `exists(/databases/$(database)/documents/admin_sessions/$(incoming().adminSessionId))`.

## 2. "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Closed Poll Submission**: Creating a response in `/surveys/survey_1/responses/1_ses1` when `/surveys/survey_1.isOpen == false`.
2. **Over-Selection in Survey 1**: Creating a response in `survey_1` with 3 options `["ai_training", "digital_bank", "simulators"]`.
3. **Invalid Option Injection**: Creating a response in `case_1` with `["Z"]` or `["A", "B"]`.
4. **Incomplete/Duplicate Sequence in Case 3**: Creating a response in `case_3` with `["step_1", "step_1", "step_2", "step_3"]`.
5. **Shadow Field Injection**: Adding `isAdmin: true` or `extraField: "hack"` to a response payload.
6. **Client Timestamp Forgery**: Setting `submittedAt` to a past timestamp instead of `request.time`.
7. **Stale Round Injection**: Submitting `round: 1` when `parent.activeRound == 2`.
8. **ID Poisoning**: Creating a document with an ID longer than 128 characters or containing `$`/`.`/`/`.
9. **Active Vote Deletion**: Attempting `deleteDoc` on a response whose `round == parent.activeRound`.
10. **Password Hash Scraping**: Reading `/admin_config/auth` or listing `/admin_sessions`.
11. **Unauthorized Admin Session Creation**: Creating `/admin_sessions/fake` with a wrong `passwordHash`.
12. **Unauthorized Survey Close**: Updating `/surveys/survey_1` with `isOpen: false` using a nonexistent `adminSessionId`.
