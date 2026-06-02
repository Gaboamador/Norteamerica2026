import { useEffect } from "react";
import { useStandingsDirty } from "@/context/StandingsDirtyContext";

const NORMAL_FAVICON = "/favicon.svg";
const DIRTY_FAVICON = "/favicon-dirty.svg";

export default function DirtyTabIndicator() {
  const ctx = useStandingsDirty();

  const isDirty = Boolean(ctx?.dirty);

  useEffect(() => {
    const favicon = document.querySelector("link[rel='icon']");

    if (!favicon) return;

    favicon.href = isDirty ? DIRTY_FAVICON : NORMAL_FAVICON;
  }, [isDirty]);

  return null;
}