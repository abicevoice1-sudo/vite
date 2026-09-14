// ─── Member-scoped storage helpers (onboarding profile, deck state) ──────────
const MY_PROFILE_KEY = 'shiarishta_my_profile';

export function getMyProfile() {
  try {
    const raw = localStorage.getItem(MY_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveMyProfile(profile) {
  try {
    localStorage.setItem(MY_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}
