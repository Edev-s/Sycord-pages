1. **Refactor Stage Cards Visibility (Mutually Exclusive)**
   - Only ONE stage card should be visible at a time (`ThinkingCard`, `ProgressCard`, `FirebaseConnectionCard`, `SavingCard`, or `NeedsInfoCard` if applicable).
   - Once a stage finishes, it should fade out and be replaced by the next stage, preventing stacking.
2. **Refine Input Bar UI**
   - The Input Bar must have a solid, dark, un-nested appearance matching the screenshot provided (unified background with no nested input boxes, dark grey pill shape).
   - Ensure the `InputBar` is pinned/sticky at the bottom on mobile (using `fixed` or `sticky` positioning and appropriate z-index/padding).
3. **Verify and Submit**
   - Verify visually via Playwright/live preview that the stages replace each other and the input bar looks correct.
   - Follow pre-commit instructions and submit.
