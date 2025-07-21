import React from "react";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Wrench, ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Garde une trace dans la console pour le débogage
    console.warn(
      `404 Not Found: L'utilisateur a tenté d'accéder à la route inexistante : ${location.pathname}`
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="relative inline-block">
          <h1 className="text-9xl font-extrabold text-blue-600 dark:text-blue-500 tracking-tighter">
            404
          </h1>
          <Wrench className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-24 w-24 text-blue-300/20 dark:text-blue-800/30" />
        </div>

        <h2 className="mt-8 text-3xl font-bold text-gray-900 dark:text-white">
          Page Introuvable
        </h2>

        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Retourner au tableau de bord
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="mailto:support@maintenancepro.com">
              <MessageSquare className="mr-2 h-5 w-5" />
              Contacter le support
            </a>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
