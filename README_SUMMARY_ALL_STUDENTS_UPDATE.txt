SFK KindTrack - Kindness Alternative Payment / Settlement Update

What was added:
- ViolationTypes supports:
  KindnessAlternative
  KindnessValue

- Violations supports:
  SettlementType
  KindnessTask
  KindnessStatus
  KindnessCompletedDate

Admin features:
- Add/Edit violation can record settlement info.
- Manage Violation Fees can add single or bulk violation types with kindness alternative payment.
- Bulk format:
  Name | Fee | Category | Threshold | Kindness Alternative Payment | Kindness Value

Examples:
Tardiness | 20 | Punctuality | 3 | Assist classroom clean-up | 1 task
No ID | 10 | Uniform | 3 | Reflection + arrange chairs | 1 task
Using phone during class | 20 | Device Use | 2 | Reflection + classroom help | 2 tasks

Required sheet headers:

ViolationTypes:
ViolationID | ViolationName | Fee | AlertThreshold | Category | KindnessAlternative | KindnessValue

Violations:
RecordID | StudentID | Date | ViolationType | Fee | Status | Notes | EncodedBy | ActionTaken | ReflectionCommitment | FollowUpDate | FollowUpStatus | ParentContacted | AutoSource | AutoKey | SettlementType | KindnessTask | KindnessStatus | KindnessCompletedDate

Important:
- Replace index.html, script.js, and style.css.
- Replace Apps Script / Code.gs with CodeGS_Attendance_Update.txt.
- Deploy Apps Script as New Version.
- Apps Script will auto-add missing columns if old sheet headers are incomplete.
