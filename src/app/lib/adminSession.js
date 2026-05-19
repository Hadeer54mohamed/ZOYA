import { useCallback, useSyncExternalStore } from "react";

const ADMIN_SESSION_KEY = "zoya_admin_pass";
const OPEN_PROFIT_MODAL_KEY = "zoya_open_profit_modal";

export function setAdminSessionPassword(password) {
  if (typeof window === "undefined" || !password) return;
  try {
    sessionStorage.setItem(ADMIN_SESSION_KEY, password);
  } catch {
    /* ignore quota / private mode */
  }
}

export function getAdminSessionPassword() {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) || "";
  } catch {
    return "";
  }
}

export function clearAdminSessionPassword() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Navigate to /admin then open Profit Analytics (set before Link navigation). */
export function requestOpenProfitModal() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(OPEN_PROFIT_MODAL_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function consumeOpenProfitModalRequest() {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem(OPEN_PROFIT_MODAL_KEY) !== "1") return false;
    sessionStorage.removeItem(OPEN_PROFIT_MODAL_KEY);
    return true;
  } catch {
    return false;
  }
}

/** Client-only admin password from sessionStorage (no effect/setState cascade). */
export function useAdminSessionPassword() {
  const subscribe = useCallback((onStoreChange) => {
    if (typeof window === "undefined") return () => {};
    const onStorage = (e) => {
      if (e.key === ADMIN_SESSION_KEY) onStoreChange();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const getSnapshot = useCallback(() => getAdminSessionPassword(), []);
  const getServerSnapshot = useCallback(() => "", []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
