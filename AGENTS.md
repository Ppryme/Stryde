<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Guidelines & Error Tracking

## Error Documentation Rule (`errorDoc.md`)
Whenever any bug, error, or problematic behavior is encountered and resolved:
- Immediately record a very short bullet-point summary in `errorDoc.md` in the project root.
- Follow the standard format:
  - **Issue:** Brief description of the symptom.
  - **Root Cause:** Key reason(s) why it occurred.
  - **Fix & Prevention:** How it was resolved and how to avoid it.

