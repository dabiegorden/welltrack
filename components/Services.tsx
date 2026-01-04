import { BookOpen, Brain, Heart, Phone, Shield, Users } from "lucide-react";

// Features Section
const Services = () => {
  const features = [
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Stress Assessment",
      description:
        "Evidence-based tools to monitor and understand your stress levels with personalized insights.",
      color: "from-red-500 to-pink-500",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Peer Support",
      description:
        "Connect with fellow officers in a confidential, moderated community environment.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Resource Library",
      description:
        "Access expert articles, videos, and guides on mental health and wellness topics.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Professional Counseling",
      description:
        "Book sessions with licensed therapists who specialize in first responder mental health.",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Progress Tracking",
      description:
        "Visualize your wellness journey with detailed analytics and milestone tracking.",
      color: "from-orange-500 to-yellow-500",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Bank-Level Security",
      description:
        "Your data is protected with military-grade encryption and strict privacy controls.",
      color: "from-slate-600 to-slate-800",
    },
  ];

  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
            Everything You Need for Wellness
          </h2>
          <p className="text-xl text-slate-600">
            Comprehensive tools designed specifically for law enforcement
            professionals to support mental health and resilience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-transparent"
            >
              <div
                className={`w-14 h-14 bg-linear-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default Services;
