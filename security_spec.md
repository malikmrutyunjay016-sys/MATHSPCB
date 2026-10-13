# Security Specification

## 1. Data Invariants
1. Only authenticated administrators can modify Faculty, Students, Facilities, Books, Question Papers, Notices, Committees, Important Contacts, and Department Settings.
2. The public may read published educational resources: Faculty, Facilities, Library Books, Question Papers, Notices, Committees, and Important Contacts.
3. Contact message inquiries can be submitted by anyone, but read/delete access is restricted strictly to administrators.
4. Administrator write operations require authentication and admin authorization.
5. Student records cannot be created without required academic identifiers (rollNumber, name, course, academicYear).
6. String fields are capped by size limits to prevent Denial of Wallet attacks.

## 2. Dirty Dozen Threat Vectors
1. Unauthenticated client attempting to delete a Faculty member.
2. Unauthenticated client attempting to create an invalid Student record without required roll number.
3. Unauthenticated client attempting to read contact_messages submitted by other people.
4. Client attempting to inject a 10MB string into a notice title or body.
5. Non-admin client attempting to elevate themselves into `/admins/` document.
6. Malicious actor attempting to delete all library books.
7. Unauthenticated user attempting to modify department statistics.
8. Attacker submitting a contact message without required message text or name.
9. Attacker injecting oversized path variables or special characters.
10. Attacker modifying immutable student roll numbers or IDs with malicious payloads.
11. Attacker submitting unauthorized updates to question papers.
12. Attacker attempting arbitrary writes to non-existent collections.
