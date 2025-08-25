import React, { useState } from "react";
import { Eye, EyeOff, Wrench, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiError, User } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface LoginResponse {
  token: string;
  user: User;
}
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { toast } = useToast();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post<LoginResponse, unknown>("auth/login", {
        email,
        password,
      });

      // Utiliser la fonction login de l'AuthContext
      login(response.token);

      toast({
        title: "Connexion réussie",
        description: `Bienvenue, ${response.user.firstName} ! Redirection...`,
      });

      onLoginSuccess?.();
      onClose();
    } catch (error) {
      let description = "Email ou mot de passe incorrect.";
      if (error instanceof ApiError) {
        if (
          typeof error.details === "object" &&
          "message" in error.details &&
          typeof error.details.message === "string"
        ) {
          description = error.details.message;
        }
      } else if (error instanceof TypeError) {
        // Erreur réseau (fetch échoué, backend inaccessible, CORS, etc.)
        description =
          "Impossible de contacter le serveur. Vérifiez votre connexion ou contactez l'administrateur.";
      } else if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
      ) {
        // Autre erreur JS
        description = error.message;
      }
      toast({
        title: "Erreur de connexion",
        description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    // Ici tu peux appeler ton endpoint reset-password
    setTimeout(() => {
      setIsSending(false);
      toast({
        title: "Lien envoyé",
        description: `Un email a été envoyé à ${forgotEmail} si ce compte existe.`,
      });
      setShowForgot(false);
    }, 1500);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-2xl rounded-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center space-x-3 text-2xl font-bold text-white">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-2 rounded-lg shadow-lg">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <span>Connexion</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm mt-1">
              Accédez à votre espace MaintenancePro.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                className="bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/40 rounded-xl transition duration-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 relative">
              <Label htmlFor="password" className="text-slate-300">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  className="bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/40 rounded-xl transition duration-300 pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200 transition"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-sm font-medium text-blue-400 hover:text-blue-500 transition-colors"
              >
                Mot de passe oublié ?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-lg font-semibold rounded-xl py-4 shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isLoading}
            >
              <AnimatePresence initial={false} mode="wait">
                {isLoading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    Connexion...
                  </motion.span>
                ) : (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    Se connecter
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- Modal mot de passe oublié --- */}
      <Dialog open={showForgot} onOpenChange={setShowForgot}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-2xl rounded-2xl">
          <DialogHeader className="mb-6">
            <DialogTitle className="flex items-center space-x-3 text-2xl font-bold text-white">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-2 rounded-lg shadow-lg">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <span>Mot de passe oublié</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm mt-1">
              Entrez votre email pour recevoir un lien de réinitialisation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="votre@email.com"
                className="bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-600/40 rounded-xl transition duration-300"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-lg font-semibold rounded-xl py-4 shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isSending}
            >
              <AnimatePresence initial={false} mode="wait">
                {isSending ? (
                  <motion.span
                    key="sending"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    Envoi...
                  </motion.span>
                ) : (
                  <motion.span
                    key="send"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    Envoyer le lien
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginModal;
