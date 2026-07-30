"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAuthModalStore } from "@/stores/useAuthModalStore";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2, delay: 0.05 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 12,
    transition: { duration: 0.18, ease: "easeIn" as const },
  },
};

export function AuthModal() {
  const { isOpen, activeTab, closeModal, setActiveTab } = useAuthModalStore();

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    },
    [closeModal]
  );

  // Lock body scroll, set dynamic tab title & listen for Escape
  useEffect(() => {
    let prevTitle = "";
    if (isOpen) {
      prevTitle = document.title;
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);

      if (activeTab === "login") {
        document.title = "BARBARA | Masuk";
      } else if (activeTab === "register") {
        document.title = "BARBARA | Daftar";
      }
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
      if (isOpen && prevTitle) {
        document.title = prevTitle;
      }
    };
  }, [isOpen, activeTab, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="auth-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
            onClick={closeModal}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            role="dialog"
            aria-modal="true"
            aria-label="Authentication Modal"
          >
            <motion.div
              key="auth-modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="pointer-events-auto relative w-full max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden"
              style={{ maxHeight: "90vh" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header Bar with Tabs and Close Button */}
              <div className="relative flex items-center justify-between border-b border-brand-light pr-12 pl-2 bg-white">
                <div className="flex flex-1">
                  <button
                    type="button"
                    id="auth-tab-login"
                    onClick={() => setActiveTab("login")}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.12em] text-center transition-all cursor-pointer ${
                      activeTab === "login"
                        ? "text-brand-black border-b-2 border-brand-black -mb-px"
                        : "text-brand-gray-light hover:text-brand-black"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    id="auth-tab-register"
                    onClick={() => setActiveTab("register")}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.12em] text-center transition-all cursor-pointer ${
                      activeTab === "register"
                        ? "text-brand-black border-b-2 border-brand-black -mb-px"
                        : "text-brand-gray-light hover:text-brand-black"
                    }`}
                  >
                    I&apos;m New Here
                  </button>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  id="auth-modal-close"
                  onClick={closeModal}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full text-brand-gray hover:text-brand-black hover:bg-brand-light transition-all cursor-pointer"
                  aria-label="Tutup modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Content */}
              <div
                className="overflow-y-auto p-8"
                style={{ maxHeight: "calc(90vh - 56px)" }}
              >
                <AnimatePresence mode="wait">
                  {activeTab === "login" ? (
                    <motion.div
                      key="login-form"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.18 }}
                    >
                      <LoginForm />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="register-form"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.18 }}
                    >
                      <RegisterForm />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
