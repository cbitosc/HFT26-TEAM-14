"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { Profile } from "@/lib/types";

const PROFILE_STORAGE_KEY = "careerfit-ai-profile-v1";

export const EMPTY_PROFILE: Profile = {
  name: "",
  email: "",
  location: "",
  current_title: "",
  years_experience: 0,
  career_stage: "fresher",
  summary: "",
  skills: [],
  experience: [],
  projects: [],
  education: [],
  certifications: [],
};

export type SaveState = "loading" | "saving" | "saved" | "error";
type ProfileContextValue = {
  profile: Profile;
  setProfile: Dispatch<SetStateAction<Profile>>;
  saveState: SaveState;
  isHydrated: boolean;
  saveNow: (nextProfile?: Profile) => boolean;
  resetProfile: () => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function normalizeProfile(value: Partial<Profile>): Profile {
  const validCareerStages = ["student", "final_year", "fresher", "early_career", "experienced"] as const;
  return {
    ...EMPTY_PROFILE,
    ...value,
    name: typeof value.name === "string" ? value.name : "",
    email: typeof value.email === "string" ? value.email : "",
    location: typeof value.location === "string" ? value.location : "",
    current_title: typeof value.current_title === "string" ? value.current_title : "",
    summary: typeof value.summary === "string" ? value.summary : "",
    years_experience: Number.isFinite(Number(value.years_experience)) ? Number(value.years_experience) : 0,
    career_stage: validCareerStages.includes(value.career_stage as (typeof validCareerStages)[number]) ? value.career_stage as Profile["career_stage"] : "fresher",
    skills: Array.isArray(value.skills) ? value.skills : [],
    experience: Array.isArray(value.experience) ? value.experience : [],
    projects: Array.isArray(value.projects) ? value.projects : [],
    education: Array.isArray(value.education) ? value.education : [],
    certifications: Array.isArray(value.certifications) ? value.certifications : [],
  };
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [isHydrated, setIsHydrated] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("loading");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) setProfile(normalizeProfile(JSON.parse(saved) as Partial<Profile>));
      setSaveState("saved");
    } catch {
      setSaveState("error");
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [profile, isHydrated]);

  const saveNow = useCallback((nextProfile = profile) => {
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
      setSaveState("saved");
      return true;
    } catch {
      setSaveState("error");
      return false;
    }
  }, [profile]);

  const resetProfile = useCallback(() => {
    setProfile(EMPTY_PROFILE);
    try {
      window.localStorage.removeItem(PROFILE_STORAGE_KEY);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, []);

  const value = useMemo(() => ({ profile, setProfile, saveState, isHydrated, saveNow, resetProfile }), [profile, saveState, isHydrated, saveNow, resetProfile]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfile must be used inside ProfileProvider");
  return context;
}
