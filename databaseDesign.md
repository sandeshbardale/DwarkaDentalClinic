# Dwarka Dental Clinic - MongoDB Schema

This design uses MongoDB collections and references between records. Do not store a
patient's complete appointment, clinical, or payment history inside the patient
document: those arrays grow without a practical limit and are queried independently.

Use MongoDB `ObjectId` values for `_id` and references. Keep human-readable IDs such
as `patientNumber`, `appointmentNumber`, and `invoiceNumber` as separate unique fields.
All date fields below are BSON `Date` values, not formatted strings.

## 1. clinics

```js
{
    _id: ObjectId,
    name: "Dwarka Dental Clinic",
    phone: string,
    email: string,
    address: {
        line1: string,
        line2: string,
        city: string,
        state: string,
        postalCode: string,
        country: string
    },
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
}
```

## 2. users

Use one collection for administrators, doctors, and receptionists. A doctor and a
receptionist are both staff members with different permissions.

```js
{
    _id: ObjectId,
    clinicId: ObjectId,
    name: string,
    email: string,
    passwordHash: string,
    role: "admin" | "doctor" | "receptionist",
    phone: string,
    specialization: string,
    qualifications: [string],
    experienceYears: number,
    salary: number, // Optional; restrict this field to admin access
    status: "active" | "inactive",
    lastLoginAt: Date,
    createdAt: Date,
    updatedAt: Date
}
```

Never store plain-text passwords. Enforce `role` permissions in authentication
middleware, not from a client-supplied request header.

## 3. patients

```js
{
    _id: ObjectId,
    clinicId: ObjectId,
    patientNumber: "DWK-2026-0001",
    name: string,
    age: number,
    gender: "male" | "female" | "other",
    phone: string,
    email: string,
    address: {
        line1: string,
        line2: string,
        city: string,
        state: string,
        postalCode: string
    },
    emergencyContact: {
        name: string,
        relation: string,
        phone: string
    },
    bloodGroup: string,
    allergies: [string],
    medicalAlerts: [string],
    generalMedicalHistory: string,
    assignedDoctorId: ObjectId,
    status: "new" | "follow_up" | "completed" | "inactive",
    registeredAt: Date,
    lastVisitAt: Date,
    nextFollowUpAt: Date,
    totalVisits: number,
    isDeleted: boolean,
    createdAt: Date,
    updatedAt: Date
}
```

Do not store `age`; calculate it from `dateOfBirth`. Do not store `appointments`
or `payments` arrays here. Those belong in their own collections.

## 4. treatmentCategories

```js
{
    _id: ObjectId,
    clinicId: ObjectId,
    name: "Root Canal",
    code: "RCT",
    defaultDurationMinutes: number,
    defaultFollowUpDays: number,
    isActive: boolean
}
```

Example categories: Orthodontics, Root Canal, Dental Implants, Extractions,
Prosthodontics, Cleaning and Scaling, Cavity Filling, and Consultation.

## 5. appointments

```js
{
    _id: ObjectId,
    clinicId: ObjectId,
    appointmentNumber: "APT-2026-0001",
    patientId: ObjectId,
    doctorId: ObjectId,
    treatmentCategoryId: ObjectId,
    startAt: Date,
    endAt: Date,
    durationMinutes: number,
    status: "scheduled" | "confirmed" | "in_progress" |
                    "completed" | "cancelled"  | "rescheduled",
    notes: string,
    rescheduledFromId: ObjectId,
    createdById: ObjectId,

    confirmedAt: Date,
    completedAt: Date,


    createdAt: Date,
    updatedAt: Date,
    isDeleted: boolean
}
```

Store `startAt` and `endAt` as dates so appointments can be sorted, filtered, and
checked for overlap. Use the clinic timezone when displaying them.

## 6. doctorAvailability

```js
{
    _id: ObjectId,
    clinicId: ObjectId,
    doctorId: ObjectId,
    dayOfWeek: number, // 0 = Sunday, 6 = Saturday
    startTime: "09:00",
    endTime: "17:00",
    effectiveFrom: Date,
    effectiveTo: Date,
    isActive: boolean
}
```

Use a separate `blockedTimes` collection for leave, holidays, and unavailable
periods. Check availability before creating or rescheduling an appointment.

## 7. clinicalRecords

One document represents one patient visit or treatment encounter.

```js
{
    _id: ObjectId,
    clinicId: ObjectId,
    patientId: ObjectId,
    appointmentId: ObjectId,
    doctorId: ObjectId,
    visitDate: Date,
    diagnosis: string,
    clinicalNotes: string,
    followUpDate: Date,
    followUpInstructions: string,
    status: "draft" | "completed" | "edited",
    createdAt: Date,
    updatedAt: Date,
    isDeleted: boolean
}
```

## 8. dentalFindings

Dental findings are stored separately because a single visit can contain findings
for multiple teeth.

```js
{
    _id: ObjectId,
    clinicId: ObjectId,
    patientId: ObjectId,
    clinicalRecordId: ObjectId,
    toothNumber: string, // FDI or Universal numbering; choose one convention
    surface: "mesial" | "distal" | "occlusal" | "buccal" | "lingual" | "all",
    condition: "healthy" | "cavity" | "restored" | "missing" | "fractured" |
                         "root_canal" | "implant" | "crown" | "other",
    notes: string,
    recordedById: ObjectId,
    recordedAt: Date
}
```

## 9. prescriptions

```js
{
    _id: ObjectId,
    clinicId: ObjectId,
    patientId: ObjectId,
    clinicalRecordId: ObjectId,
    doctorId: ObjectId,
    items: [
        {
            medicineName: string,
            dosage: string,
            frequency: string,
            durationDays: number,
            instructions: string
        }
    ],
    issuedAt: Date,
    createdAt: Date
}
```

## 10. treatmentPlans and treatmentPlanItems
<!-- 
```js
// treatmentPlans
{
    _id: ObjectId,
    clinicId: ObjectId,
    patientId: ObjectId,
    doctorId: ObjectId,
    name: string,
    diagnosis: string,
    status: "proposed" | "accepted" | "active" | "completed" | "cancelled",
    estimatedTotal: number,
    startDate: Date,
    expectedEndDate: Date,
    acceptedAt: Date,
    createdAt: Date,
    updatedAt: Date
} -->

<!-- // treatmentPlanItems
{
    _id: ObjectId,
    treatmentPlanId: ObjectId,
    treatmentCategoryId: ObjectId,
    toothNumbers: [string],
    description: string,
    quantity: number,
    unitPrice: number,
    discount: number,
    status: "planned" | "in_progress" | "completed" | "cancelled",
    completedAt: Date
}
``` -->

<!-- This supports multi-visit treatments such as root canals, implants, orthodontics,
and prosthodontics. -->

## 11. invoices

An invoice is the bill. A payment is only a transaction against that bill.

```js
{
    _id: ObjectId,
    clinicId: ObjectId,
    invoiceNumber: "INV-2026-0001",
    patientId: ObjectId,
    appointmentId: ObjectId,
    treatmentPlanId: ObjectId,
    items: [
        {
            description: string,
            treatmentCategoryId: ObjectId,
            quantity: number,
            unitPrice: number,
            discount: number,
            amount: number
        }
    ],
    subtotal: number,
    discount: number,
    tax: number,
    total: number,
    amountPaid: number,
    balanceDue: number,
    status: "draft" | "issued" | "partially_paid" | "paid" | "cancelled",
    issuedAt: Date,
    dueAt: Date,
    createdAt: Date,
    updatedAt: Date
}
```

## 12. payments

```js
{
    _id: ObjectId,
    clinicId: ObjectId,
    receiptNumber: "RCPT-2026-0001",
    invoiceId: ObjectId,
    patientId: ObjectId,
    amount: number,
    method: "cash" | "upi" | "card" | "bank_transfer",
    status: "pending" | "paid" | "failed" | "refunded",
    transactionReference: string,
    paidAt: Date,
    notes: string,
    recordedById: ObjectId,
    createdAt: Date,
    updatedAt: Date,
    isDeleted: boolean
}
```

Use decimal-safe money handling. Store amounts as integer paise, or use MongoDB
Decimal128, rather than JavaScript floating-point numbers.

## 13. files and aiReports

```js
// files
{
    _id: ObjectId,
    clinicId: ObjectId,
    patientId: ObjectId,
    clinicalRecordId: ObjectId,
    uploadedById: ObjectId,
    fileType: "xray" | "photo" | "prescription" | "document",
    storageKey: string,
    originalName: string,
    mimeType: string,
    sizeBytes: number,
    uploadedAt: Date
}

// aiReports
{
    _id: ObjectId,
    clinicId: ObjectId,
    patientId: ObjectId,
    fileId: ObjectId,
    result: "cavity" | "normal" | "uncertain",
    suggestions: [string],
    confidence: number,
    modelVersion: string,
    reviewedById: ObjectId,
    reviewedAt: Date,
    createdAt: Date
}
```

Store uploaded files in object storage or a protected file service. Store only the
reference and metadata in MongoDB.

## 14. notifications and auditLogs

```js
// notifications
{
    _id: ObjectId,
    clinicId: ObjectId,
    recipientUserId: ObjectId,
    patientId: ObjectId,
    appointmentId: ObjectId,
    type: "appointment_reminder" | "follow_up" | "payment" | "system",
    channel: "in_app" | "whatsapp" | "email" | "sms",
    title: string,
    message: string,
    status: "pending" | "sent" | "failed" | "read",
    sentAt: Date,
    readAt: Date,
    errorMessage: string,
    createdAt: Date
}

// auditLogs
{
    _id: ObjectId,
    clinicId: ObjectId,
    actorUserId: ObjectId,
    action: "create" | "update" | "delete" | "login" | "export",
    collectionName: string,
    documentId: ObjectId,
    before: object,
    after: object,
    createdAt: Date
}
```

Audit logs are especially important for clinical and payment records. Do not put
passwords or other secrets in `before` or `after` snapshots.

## Recommended indexes

```js
db.users.createIndex({ clinicId: 1, email: 1 }, { unique: true })
db.patients.createIndex({ clinicId: 1, patientNumber: 1 }, { unique: true })
db.patients.createIndex({ clinicId: 1, phone: 1 })
db.appointments.createIndex({ clinicId: 1, doctorId: 1, startAt: 1 })
db.appointments.createIndex({ clinicId: 1, patientId: 1, startAt: -1 })
db.appointments.createIndex({ clinicId: 1, status: 1, startAt: 1 })
db.clinicalRecords.createIndex({ clinicId: 1, patientId: 1, visitDate: -1 })
db.dentalFindings.createIndex({ clinicId: 1, patientId: 1, toothNumber: 1 })
db.invoices.createIndex({ clinicId: 1, invoiceNumber: 1 }, { unique: true })
db.payments.createIndex({ clinicId: 1, invoiceId: 1, paidAt: -1 })
db.notifications.createIndex({ recipientUserId: 1, status: 1, createdAt: -1 })
```

For a multi-clinic system, include `clinicId` in every collection and every query.
For a single clinic, retaining `clinicId` still makes future expansion easier.

## Migration note

The current backend is not using MongoDB yet: `Backend/src/database.js` defines
Sequelize models backed by SQLite. To use this design, replace Sequelize with the
MongoDB driver or Mongoose, convert string IDs to `ObjectId` references, and update
the controllers to query the collections above. The current backend also has
`User`, `ClinicalRecord`, and `AiReport` models that map directly to this design.