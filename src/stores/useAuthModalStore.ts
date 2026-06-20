import { create } from "zustand";

export type AuthModalTab = "login" | "register";

interface AuthModalState {
  isOpen: boolean;
  activeTab: AuthModalTab;
  callbackUrl: string;
  openModal: (tab?: AuthModalTab, callbackUrl?: string) => void;
  closeModal: () => void;
  setActiveTab: (tab: AuthModalTab) => void;
}

export const useAuthModalStore = create<AuthModalState>()((set) => ({
  isOpen: false,
  activeTab: "login",
  callbackUrl: "/",

  openModal: (tab = "login", callbackUrl = "/") =>
    set({ isOpen: true, activeTab: tab, callbackUrl }),

  closeModal: () => set({ isOpen: false }),

  setActiveTab: (tab) => set({ activeTab: tab }),
}));
