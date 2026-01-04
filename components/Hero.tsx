import { ArrowRight, CheckCircle2, Shield, Activity, Star } from "lucide-react";

// Hero Section
const Hero = () => {
  return (
    <section className="relative min-h-screen bg-linear-to-br from-blue-600 via-blue-700 to-cyan-600 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="z-10 space-y-8 animate-in fade-in slide-in-from-left duration-700">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">
                Trusted by 1,000+ Officers
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Your Mental Health Matters
            </h1>

            <p className="text-xl text-white/90 leading-relaxed max-w-xl">
              A confidential platform designed exclusively for law enforcement
              professionals to access mental health support, resources, and
              community.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
              {["24/7 Support", "100% Confidential", "Expert Counselors"].map(
                (item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20"
                  >
                    <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                    <span className="text-white text-sm font-medium">
                      {item}
                    </span>
                  </div>
                )
              )}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="group bg-white text-blue-700 px-8 py-4 rounded-full font-semibold hover:shadow-2xl transition-all duration-200 flex items-center justify-center gap-2">
                Start Your Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="border-2 border-white/30 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition-all duration-200">
                Learn More
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                {[
                  "photo-1507003211169-0a1dd7228f2d",
                  "photo-1494790108377-be9c29b29330",
                  "photo-1500648767791-00dcc994a43e",
                  "photo-1438761681033-6461ffad8d80",
                ].map((id) => (
                  <img
                    key={id}
                    src={`https://images.unsplash.com/${id}?w=100&h=100&fit=crop`}
                    alt="User"
                    className="w-12 h-12 rounded-full border-3 border-white object-cover"
                  />
                ))}
              </div>
              <div>
                <div className="flex gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-white/90 text-sm font-medium">
                  4.9/5 from 500+ reviews
                </p>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div
            className="relative animate-in fade-in slide-in-from-right duration-700"
            style={{ animationDelay: "200ms" }}
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=1000&fit=crop"
                alt="Police Officer Wellness"
                className="w-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-blue-900/50 to-transparent"></div>
            </div>

            {/* Floating Cards */}
            <div
              className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl p-4 max-w-xs animate-in fade-in slide-in-from-right duration-500"
              style={{ animationDelay: "800ms" }}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                  <Activity size={24} color="#16a34a" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    Wellness Score
                  </p>
                  <p className="text-2xl font-bold text-green-600">85%</p>
                </div>
              </div>
            </div>

            <div
              className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 max-w-xs animate-in fade-in slide-in-from-left duration-500"
              style={{ animationDelay: "1000ms" }}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    Protected Data
                  </p>
                  <p className="text-xs text-slate-600">End-to-end encrypted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
