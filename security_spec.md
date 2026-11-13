# Security Specification: CuanUMKM Firebase Security Architecture

## 1. Data Invariants
1. **User Identity Isolation**: Every transaction record must have `userId == request.auth.uid`. A user can never read, list, create, update, or delete another user's transactions.
2. **Transaction Integrity**:
   - `type` must strictly be either `'income'` or `'expense'`.
   - `amount` must be a positive number (`> 0`).
   - `category` must be a valid non-empty string under 64 characters.
   - `date` must be a valid date string (YYYY-MM-DD).
   - `notes` is optional but if present must be a string <= 500 characters.
   - `createdAt` is immutable upon creation.
3. **User Profile Invariant**:
   - A user profile at `/users/{userId}` can only be accessed or modified by `request.auth.uid == userId`.
   - `businessName` and `ownerName` are required strings with length <= 100 characters.

## 2. The Dirty Dozen Payloads (Negative Test Cases)
1. **Unauthenticated Read**: Attempting to read `/transactions/{id}` without signing in -> REJECT.
2. **Cross-Tenant List Scraping**: Signed in as User A, attempting `collection('transactions')` without `where('userId', '==', 'user_a')` -> REJECT.
3. **Cross-Tenant Document Read**: Signed in as User A, reading User B's `/transactions/{tx_b}` -> REJECT.
4. **Identity Spoofing on Create**: Signed in as User A, creating a transaction with `userId: 'user_b'` -> REJECT.
5. **Ghost Field Poisoning**: Creating transaction with rogue property `{ isVerifiedAdmin: true }` -> REJECT.
6. **Negative Amount Attack**: Creating transaction with `amount: -500000` -> REJECT.
7. **Invalid Type Attack**: Creating transaction with `type: 'investment_dividend_unapproved'` -> REJECT.
8. **String Bomb / DOS**: Submitting `notes` with 50KB character string -> REJECT.
9. **Immutable Overwrite**: Updating an existing transaction and tampering with `userId` or `createdAt` -> REJECT.
10. **Path Traversal / Malicious ID**: Creating `/transactions/..%2Fhack` with invalid character string -> REJECT.
11. **Cross-User Profile Hijack**: Signed in as User A, updating `/users/user_b` -> REJECT.
12. **Malicious Empty Fields**: Submitting empty businessName or missing required fields -> REJECT.
