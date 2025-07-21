import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  motion,
  useSpring,
  useTransform,
  useInView,
  AnimatePresence,
} from "framer-motion";
import {
  Building2,
  Users,
  Wrench,
  TrendingUp,
  Calendar,
  AlertTriangle,
  LogIn,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Twitter,
  ChevronRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import LoginModal from "@/components/auth/LoginModal";

// --- COMPOSANT PRINCIPAL ---
const Index = () => {
  const [showLogin, setShowLogin] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLoginSuccess = () => {
    setShowLogin(false);
    queryClient.invalidateQueries();
  };

  if (isLoading || isAuthenticated) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  return (
    <div className="relative min-h-screen w-full bg-slate-900 text-white overflow-x-hidden">
      <div className="absolute inset-0 -z-10 h-full w-full bg-slate-900 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-600/20 blur-[100px]"></div>
      </div>

      <Header onLoginClick={() => setShowLogin(true)} />
      <main>
        <HeroSection onLoginClick={() => setShowLogin(true)} />
        <FeaturesSection />
        <StatsSection />
        <TestimonialsSection />
        <PricingSection onLoginClick={() => setShowLogin(true)} />
        <CtaSection onLoginClick={() => setShowLogin(true)} />
      </main>
      <Footer />

      <AnimatePresence>
        {showLogin && (
          <LoginModal
            isOpen={showLogin}
            onClose={() => setShowLogin(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- SOUS-COMPOSANTS ---

const Header = ({ onLoginClick }: { onLoginClick: () => void }) => (
  <motion.header
    initial={{ y: -100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5 }}
    className="fixed top-0 z-50 w-full border-b border-gray-800 bg-gray-900/80 backdrop-blur-lg"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center space-x-3 cursor-pointer"
        >
          <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-2 rounded-lg shadow-lg">
            <Wrench className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text ">
            MaintenancePro
          </h1>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onLoginClick}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Se connecter
          </Button>
        </motion.div>
      </div>
    </div>
  </motion.header>
);

const HeroSection = ({ onLoginClick }: { onLoginClick: () => void }) => {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center px-4 py-2 rounded-full bg-gray-800 border border-gray-700 mb-6"
        >
          <span className="text-sm font-medium text-cyan-400">
            Nouvelle version disponible
          </span>
          <ChevronRight className="ml-2 h-4 w-4 text-cyan-300" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight"
        >
          <span className="block text-gray-300">Révolutionnez Votre</span>
          <span className="block mt-4 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text ">
            Gestion de Maintenance
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
        >
          Une plateforme centralisée et intuitive pour piloter vos équipements,
          planifier vos interventions et maximiser votre productivité.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Button
            onClick={onLoginClick}
            size="lg"
            className="mt-10 px-8 py-6 text-lg font-bold rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-xl hover:shadow-blue-500/30 transition-all"
          >
            <span className="flex items-center">
              Accéder à la plateforme
              <ChevronRight className="ml-2 h-5 w-5" />
            </span>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

const features = [
  {
    icon: Wrench,
    title: "Suivi des Interventions",
    description:
      "Créez, assignez et suivez chaque étape de vos interventions en temps réel.",
    color: "from-blue-500 to-cyan-400",
  },
  {
    icon: Building2,
    title: "Gestion du Parc Machine",
    description:
      "Centralisez l'historique, la documentation et les plannings de tous vos équipements.",
    color: "from-purple-500 to-blue-400",
  },
  {
    icon: Users,
    title: "Coordination d'Équipe",
    description:
      "Gérez vos techniciens, leurs plannings et leurs assignations efficacement.",
    color: "from-amber-500 to-orange-400",
  },
  {
    icon: TrendingUp,
    title: "Rapports & KPIs",
    description:
      "Accédez à des tableaux de bord et des rapports pour mesurer et optimiser vos performances.",
    color: "from-emerald-500 to-teal-400",
  },
  {
    icon: Calendar,
    title: "Maintenance Préventive",
    description:
      "Planifiez automatiquement la maintenance pour réduire les pannes et augmenter la durée de vie.",
    color: "from-violet-500 to-purple-400",
  },
  {
    icon: AlertTriangle,
    title: "Alertes Intelligentes",
    description:
      "Recevez des notifications instantanées pour les pannes critiques et les échéances.",
    color: "from-rose-500 to-pink-400",
  },
];
const FeaturesSection = () => (
  <section className="py-24 px-4 relative">
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white">
          Une Plateforme <span className="text-cyan-400">Tout-en-Un</span>
        </h2>
        <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
          Tout ce dont vous avez besoin pour une gestion de maintenance
          optimale, à un seul endroit.
        </p>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <FeatureCard key={index} {...feature} index={index} />
        ))}
      </div>
    </div>
  </section>
);
const FeatureCard = ({
  icon: Icon,
  title,
  description,
  color,
  index,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    whileHover={{ y: -5 }}
    className="h-full"
  >
    <div className="h-full p-6 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-cyan-400/30 transition-all duration-300 backdrop-blur-sm">
      <div className="flex items-center space-x-4 mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <p className="text-gray-400">{description}</p>
    </div>
  </motion.div>
);
const AnimatedCounter = ({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const springValue = useSpring(0, { damping: 40, stiffness: 200 });
  useEffect(() => {
    if (inView) {
      springValue.set(value);
    }
  }, [inView, value, springValue]);
  const displayValue = useTransform(springValue, (latest) =>
    Math.round(latest).toLocaleString()
  );
  return (
    <span ref={ref}>
      {prefix}
      <motion.span>{displayValue}</motion.span>
      {suffix}
    </span>
  );
};
const StatsSection = () => (
  <section className="py-24 px-4 bg-gradient-to-br from-gray-900 to-gray-800/50">
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
      >
        {[
          { value: 95, suffix: "%", label: "Disponibilité machine" },
          {
            value: 40,
            prefix: "-",
            suffix: "%",
            label: "Temps d'arrêt imprévu",
          },
          {
            value: 60,
            prefix: "+",
            suffix: "%",
            label: "Efficacité des équipes",
          },
          { value: 24, suffix: "/7", label: "Accès aux données" },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <p className="text-4xl md:text-5xl font-bold text-cyan-400">
              <AnimatedCounter
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
              />
            </p>
            <p className="mt-2 text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);
const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Jean Dupont",
      role: "Directeur Maintenance, Industrie XYZ",
      content:
        "MaintenancePro a transformé notre façon de gérer les interventions. Nous avons réduit nos temps d'arrêt de 40% en 6 mois.",
      avatar: "/avatars/1.jpg",
    },
    {
      name: "Marie Lambert",
      role: "Responsable GMAO, Groupe ABC",
      content:
        "La plateforme est intuitive et puissante. L'équipe a adopté l'outil en quelques jours seulement.",
      avatar: "/avatars/2.jpg",
    },
    {
      name: "Thomas Martin",
      role: "Technicien Senior, Usine 123",
      content:
        "Enfin une application qui simplifie vraiment notre travail quotidien. Les notifications en temps réel sont un game-changer.",
      avatar: "/avatars/3.jpg",
    },
  ];
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-gray-900/50 to-gray-800/30" />
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ils nous <span className="text-cyan-400">font confiance</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Découvrez ce que nos clients disent de leur expérience.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="h-full"
            >
              <div className="h-full p-6 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-cyan-400/30 transition-all duration-300 backdrop-blur-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-700 overflow-hidden mr-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-cyan-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 italic">"{testimonial.content}"</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
const PricingSection = ({ onLoginClick }: { onLoginClick: () => void }) => {
  const pricingPlans = [
    {
      name: "Starter",
      price: "Gratuit",
      description: "Parfait pour les petites équipes",
      features: [
        "5 utilisateurs",
        "10 équipements",
        "Interventions illimitées",
        "Rapports basiques",
        "Support par email",
      ],
      cta: "Commencer gratuitement",
      popular: false,
    },
    {
      name: "Pro",
      price: "30.000 fcfa ",
      period: " /mois",
      description: "Pour les équipes en croissance",
      features: [
        "20 utilisateurs",
        "50 équipements",
        "Maintenance préventive",
        "Rapports avancés",
        "Support prioritaire",
      ],
      cta: "Essayer gratuitement",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Personnalisé",
      description: "Solution sur mesure",
      features: [
        "Utilisateurs illimités",
        "Équipements illimités",
        "Toutes les fonctionnalités Pro",
        "Intégrations personnalisées",
        "Support 24/7",
      ],
      cta: "Contactez-nous",
      popular: false,
    },
  ];
  return (
    <section className="py-24 px-4 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Des tarifs <span className="text-cyan-400">adaptés</span>
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Choisissez le plan qui correspond à vos besoins et à votre budget.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="h-full"
            >
              <div
                className={`h-full p-6 rounded-xl border transition-all duration-300 ${
                  plan.popular
                    ? "border-cyan-400/50 bg-gray-800/50"
                    : "border-gray-700 bg-gray-800/30"
                } hover:border-cyan-400/70`}
              >
                {plan.popular && (
                  <div className="text-xs font-semibold text-center text-white bg-cyan-500 rounded-full px-4 py-1 mb-4 inline-block">
                    Le plus populaire
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-end mb-4">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-400 ml-1">{plan.period}</span>
                  )}
                </div>
                <p className="text-gray-400 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="h-5 w-5 text-cyan-400 mr-2" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={onLoginClick}
                  size="lg"
                  className={`w-full ${
                    plan.popular
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  {plan.cta}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
const CtaSection = ({ onLoginClick }: { onLoginClick: () => void }) => (
  <section className="py-24 px-4 relative overflow-hidden">
    <div className="max-w-4xl mx-auto text-center">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-3xl sm:text-4xl font-bold text-white mb-6"
      >
        Prêt à <span className="text-cyan-400">révolutionner</span> votre
        maintenance ?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto"
      >
        Rejoignez des centaines d'entreprises qui optimisent déjà leur
        maintenance avec notre solution.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Button
          onClick={onLoginClick}
          size="lg"
          className="px-8 py-6 text-lg font-bold rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-xl hover:shadow-blue-500/30 transition-all"
        >
          <span className="flex items-center">
            Commencer maintenant
            <ChevronRight className="ml-2 h-5 w-5" />
          </span>
        </Button>
      </motion.div>
    </div>
  </section>
);
const Footer = () => {
  const FooterBrand = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-2 rounded-lg shadow-md">
          <Wrench className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white">MaintenancePro</h3>
      </div>
      <p className="text-gray-400 text-sm leading-relaxed">
        La solution GMAO complète pour optimiser la gestion de votre maintenance
        industrielle.
      </p>
      <div className="flex space-x-4 pt-2">
        <a
          href="#"
          className="text-gray-400 hover:text-blue-400 transition-colors"
        >
          <Twitter className="h-5 w-5" />
        </a>
        <a
          href="https://github.com/SIAKOU"
          className="text-gray-400 hover:text-blue-400 transition-colors"
        >
          <Github className="h-5 w-5" />
        </a>
        <a
          href="https://www.linkedin.com/in/siakou-stanislas-672828297/"
          className="text-gray-400 hover:text-blue-400 transition-colors"
        >
          <Linkedin className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
  const FooterLinkList = ({
    title,
    links,
  }: {
    title: string;
    links: { label: string; href: string }[];
  }) => (
    <div>
      <h4 className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-gray-300 hover:text-blue-400 transition-colors"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
  const FooterContactInfo = () => (
    <div>
      <h4 className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">
        Contact
      </h4>
      <ul className="space-y-4 text-gray-300">
        <li className="flex items-start">
          <Mail className="h-5 w-5 mr-3 mt-1 flex-shrink-0 text-gray-500" />
          <a href="mailto:SIAKOU2006@gmail.com" className="hover:text-blue-400">
            SIAKOU2006@gmail.com
          </a>
        </li>
        <li className="flex items-start">
          <Phone className="h-5 w-5 mr-3 mt-1 flex-shrink-0 text-gray-500" />
          <div>
            <a href="tel:+22892104781" className="block hover:text-blue-400">
              (+228) 92 10 47 81
            </a>
            <a href="tel:+22879509945" className="block hover:text-blue-400">
              (+228) 79 50 99 45
            </a>
          </div>
        </li>
        <li className="flex items-start">
          <MapPin className="h-5 w-5 mr-3 mt-1 flex-shrink-0 text-gray-500" />
          <span>123 Rue de l'Industrie, KATAGAN, Lomé - TOGO</span>
        </li>
      </ul>
    </div>
  );
  const quickLinks = [
    { label: "Fonctionnalités", href: "#" },
    { label: "Tarifs", href: "#" },
    { label: "Documentation", href: "#" },
  ];
  const legalLinks = [
    { label: "Conditions d'utilisation", href: "#" },
    { label: "Politique de confidentialité", href: "#" },
  ];
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <FooterBrand />
          <FooterLinkList title="Ressources" links={quickLinks} />
          <FooterContactInfo />
          <FooterLinkList title="Légal" links={legalLinks} />
        </div>
        <div className="border-t border-gray-800 mt-16 pt-8 text-center text-gray-500 text-sm">
          <p>
            © {new Date().getFullYear()} MaintenancePro. Tous droits réservés.
            Développé par Stanislas SIAKOU.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Index;
