import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिन्दी (Hindi)" },
  { code: "bn", name: "বাংলা (Bengali)" },
  { code: "te", name: "తెలుగు (Telugu)" },
  { code: "mr", name: "मराठी (Marathi)" },
  { code: "ta", name: "தமிழ் (Tamil)" },
  { code: "gu", name: "ગુજરાતી (Gujarati)" },
  { code: "ur", name: "اردو (Urdu)" },
  { code: "kn", name: "ಕನ್ನಡ (Kannada)" },
  { code: "or", name: "ଓଡ଼ିଆ (Odia)" },
  { code: "ml", name: "മലയാളം (Malayalam)" },
];

export function LanguageModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if language is already selected
    const hasSelected = localStorage.getItem("language_selected");
    if (!hasSelected) {
      setIsOpen(true);
    }
  }, []);

  const handleSelectLanguage = (code: string) => {
    localStorage.setItem("language_selected", "true");
    
    if (code !== "en") {
      // Set the Google Translate cookie
      const domain = window.location.hostname;
      document.cookie = `googtrans=/en/${code}; path=/; domain=${domain}`;
      document.cookie = `googtrans=/en/${code}; path=/`;
      // Reload to apply translation
      window.location.reload();
    } else {
      // For English, clear the cookie
      const domain = window.location.hostname;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`;
      setIsOpen(false);
      window.location.reload();
    }
  };

  return (
    <>
      {/* Floating button to change language anytime */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 bg-background shadow-elevated border-primary/20 hover:bg-primary/10"
        onClick={() => setIsOpen(true)}
      >
        <Globe className="w-6 h-6 text-primary" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-card rounded-2xl shadow-elevated border border-border p-6 relative"
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6 justify-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Globe className="w-6 h-6" />
              </div>
            </div>
            
            <h2 className="text-2xl font-display font-bold text-center mb-2">Choose your language</h2>
            <p className="text-center text-muted-foreground mb-6">
              अपनी भाषा चुनें / Select your preferred language to continue
            </p>

            <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto p-1">
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  variant="outline"
                  className="h-12 justify-center text-base hover:border-primary hover:bg-primary/5 transition-colors"
                  onClick={() => handleSelectLanguage(lang.code)}
                >
                  {lang.name}
                </Button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
