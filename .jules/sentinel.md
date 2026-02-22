## 2026-02-22 - [Securing Convex Mutations]
**Vulnerability:** Unauthenticated post creation and identity spoofing in `sendPost` mutation.
**Learning:** The mutation accepted `authorName` as a client-side argument and lacked `ctx.auth.getUserIdentity()` checks, allowing anyone to post as anyone else. Interestingly, the frontend was already omitting the `authorName` argument, making the mutation both insecure and non-functional for legitimate users.
**Prevention:** Always derive user identity and related metadata (like names) server-side from the authenticated session using `ctx.auth.getUserIdentity()`. Remove identity-related fields from mutation arguments to prevent client-side spoofing.
